import createServer from '../lib/createServer'
import env from '../lib/env'
import logger from '../lib/logger'
import mongo from 'mongoose'
var log = logger.debug;
import schedule from 'node-schedule'
import DbService from '../services/db/DbService'
import mikrotik from '../services/MikroServices/InitialService'

const PORT = env.PORT || 1338
const mainCommand = '/ip/hotspot/active/'
const command = 'remove'
createServer().then(app => {
  let callback = async () =>{
    log("//.............disabling users............//")
    let db = new DbService()
    let mikro = new mikrotik()

    let networks = await db.getAllNetworks()
    for (let i = 0; i < networks.length; i++) {
      await mikro.createMikrotikConnection(networks[i])
      logger.debug()
      let activeUsers = await mikro.excuteGetCommand(mainCommand, 'print')
      logger.debug("mkRes : ", activeUsers)
      for (let x = 0; x < activeUsers.length; x++) {
        await mikro.createMikrotikConnection(networks[i])
        let mkRes = await mikro.excutePostCommand(mainCommand, command, [`=numbers=${x}`])
        logger.debug("mkRes : ", mkRes)
      }
    }
  }
  var j = schedule.scheduleJob('* * */6 * * *', callback);
  app.listen(PORT, () => {
    const mode = env.NODE_ENV
    logger.debug(`Server listening on ${PORT} in ${mode} mode`)
  })
}, err => {
  logger.error('Error while starting up server', err)
  process.exit(1)
})
