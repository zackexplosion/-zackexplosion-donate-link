const { ObjectId, MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.DB_URI
const HOMEPAGE = process.env.HOMEPAGE || 'https://www.facebook.com/zackexplosion'
const express = require('express')
const app = express()
const port = process.env.PORT || 4001


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

app.set('view engine', 'pug');

app.get('/', async (req, res) => {
  res.redirect(HOMEPAGE)
})

app.get('/r/:id', async (req, res) => {

  try {
    const database = client.db('Links');
    const links = database.collection("Links");
    var link = await links.findOne({_id: new ObjectId(req.params.id)})

    if(!link) return res.send('404')

    // Update counter
    links.updateOne(
      {_id: new ObjectId(req.params.id)},
      { $inc: { accessTimes: 1 } }
    )

    if(link.redirectOnly && link.redirectOnly === true) {
      return res.redirect(link.originLink)
    }

    return res.render('donate', { link });
  } catch (error) {
    console.error(error)
    res.send('error')
  }
})


app.put('/r/:id', async (req, res) => {

  try {
    const database = client.db('Links');
    const links = database.collection("Links");

    // Update counter
    link =  await links.updateOne(
      {_id: new ObjectId(req.params.id)},
      { 

      }
    )
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

  } catch(e) {
    console.error(e)
  }
  finally {
    
  }
}
start()
