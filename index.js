const { ObjectId, MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI
const PASSWORD = process.env.PASSWORD
const HOMEPAGE = process.env.HOMEPAGE || 'https://www.facebook.com/zackexplosion'
const express = require('express')
const app = express()
const port = process.env.PORT || 4001
const parsePage = require('./parsePage')


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

app.set('view engine', 'pug');
app.use(express.json())
app.use(express.urlencoded({ extended: false }))


app.get('/', async (req, res) => {
  res.redirect(HOMEPAGE)
})

app.get('/r/:id', async (req, res) => {

  try {
    const database = client.db('Links')
    const links = database.collection("Links")
    var link = await links.findOne({ _id: new ObjectId(req.params.id) })

    if (!link) return res.send('404')

    // Update counter
    links.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { accessTimes: 1 } }
    )

    if (link.redirectOnly && link.redirectOnly === true) {
      return res.redirect(link.originLink)
    }

    return res.render('donate', { link });
  } catch (error) {
    console.error(error)
    res.send('error')
  }
})

function passwordCheck(req, res, next) {
  const password = req.body.password || req.query.password
  if(password !== PASSWORD) {
    return res.send('wrong password')
  }

  next()
}

app.get('/link-list', passwordCheck,  async (req, res) => {
  const database = client.db('Links');
  const links = database.collection("Links");
  const linkList = await links.find({}).sort({_id: -1})
  res.json(linkList)
})

app.put('/r', passwordCheck, async (req, res) => {
  try {
    const originLink = req.body.url
    const _link = await parsePage(originLink)

    const database = client.db('Links');
    const links = database.collection("Links");

    const redirectOnly = (req.body.redirectOnly.toString().toLowerCase() === 'true')

    const link = {
      ..._link,
      originLink,
      redirectOnly,
      createdAt: new Date()
    }
    links.insertOne(link)

    res.json(link)
  } catch (error) {
    console.error(error)
    res.send('error')
  }
})


async function start() {
  try {
    console.log('Connecting to DB')
    await client.connect();

    // start express server
    console.log('Starting express server')
    app.listen(port, () => {
      console.log(`Listening on port ${port}`)
    })

  } catch (e) {
    console.error(e)
  }
  finally {

  }
}
start()
