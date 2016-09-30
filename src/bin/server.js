import createServer from '../lib/createServer'
import env from '../lib/env'
import logger from '../lib/logger'
import mongo from 'mongoose'

const PORT = env.PORT || 1338

createServer().then(app => {
  // setInterval(async () => {
  //   // body...
  //   let separator = '-'
  //   let length = 12;
  //   var license = new Array(length + 1).join((Math.random() + '00000000000000000').slice(2, 18)).slice(0, length);
  //   license = license.toUpperCase().replace(/(\w{4})/g, '$1' + separator).substr(0, length + Math.round(length/4)-1);
  //   logger.debug("lis   " + license)
  // }, 2000)

  app.listen(PORT, () => {
    const mode = env.NODE_ENV
    logger.debug(`Server listening on ${PORT} in ${mode} mode`)
  })
}, err => {
  logger.error('Error while starting up server', err)
  process.exit(1)
})
