const { ObjectId, MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI
const PASSWORD = process.env.PASSWORD
const HOMEPAGE = process.env.HOMEPAGE || 'https://www.facebook.com/zackexplosion'
const express = require('express')
const app = express()
const cors = require('cors')
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
app.use(cors())
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
  const password = req.headers.password || req.body.password
  if(password !== PASSWORD) {
    res.status(400)
    return res.send(':(')
  }

  next()
}

app.post('/auth', passwordCheck, (req, res) => {
  res.send('OK')
})

app.get('/link-list', passwordCheck,  async (req, res) => {
  const database = client.db('Links');
  const links = database.collection("Links");
  const query = {}
  const cursor = links.find(query).sort({_id: -1})
  const result = []
  // print a message if no documents were found
  if ((await links.countDocuments(query)) === 0) {
    console.log("No documents found!");
  }
  for await (const link of cursor) {
    result.push(link)
  }
  res.json(result)
})


app.delete('/r:/id', passwordCheck, async (req, res) => {
  const database = client.db('Links');
  const links = database.collection("Links");
  try {
    var link = await links.deleteOne({ _id: new ObjectId(req.params.id) })
    return res.send('ok')
  } catch (error) {
    return res.send(error)    
  }
})

app.post('/preview-link', passwordCheck,  async (req, res) => {
  const originLink = req.body.url
  try {
    const _link = await parsePage(originLink)

    if(_link) {
      return res.json(_link)
    } else {
      res.status(400).send('error')
    }

  } catch (error) {
    res.status(400).send(error)
  }

})

app.post('/r', passwordCheck, async (req, res) => {
  try {
    const originLink = req.body.url
    const hostSite = req.body.hostSite || 'zack'
    const _link = await parsePage(originLink)

    const database = client.db('Links');
    const links = database.collection("Links");

    const link = {
      ..._link,
      originLink,
      hostSite,
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
