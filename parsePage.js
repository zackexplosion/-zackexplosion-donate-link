const axios = require('axios')
const parse = require('node-html-parser').parse


function parsePage(url) {
  return axios.get(url).then(res => {
    const root = parse(res.data);
    
    try {
      var link = {
        'og:image': root.querySelector('meta[property="og:image"]').getAttribute('content'),
        'og:title': root.querySelector('meta[property="og:title"]').getAttribute('content'),
        'og:description': root.querySelector('meta[property="og:description"]').getAttribute('content')
      }
    
      return link
    } catch (error) {
      console.error(error)
    }
  })
}

module.exports = parsePage