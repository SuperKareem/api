import logger from '../../lib/logger'
import api from 'mikronode-ng'

export default class InitialService {
  constructor () {
    // let mikroIP = '192.168.56.101';
    // let username = 'admin';
    // let password = '00'
    logger.debug('...Connecting to mikrotik')
  }
  async createMikrotikConnection(network = {username, password, mikrotikIp}){
    this.server = await api.getConnection(
      network.mikrotikIp,
      network.username,
      network.password
    ).on('error', (err)=>{
      logger.debug("**** error connecting to mikrotik Server ****")
    })
    logger.debug(' .... connected to mikrotik server ....')
  }
  async excuteGetCommand(mainCommand, secondCommand){
    logger.debug(mainCommand + secondCommand)
    return new Promise(async (resolve, reject)=>{
      await this.getParsedData(resolve, reject, mainCommand + secondCommand)
    })
  }
  async excutePostCommand(mainCommand, secondCommand, data){
    let command  = [
      mainCommand+secondCommand,
      ...data
    ]
    logger.debug(command)
    return new Promise(async (resolve, reject)=>{
      await this.getParsedData(resolve, reject, command)
    })
  }
  async getParsedData(resolve, reject, command){
    let data = await this.excuteApiCommand(command)
    data.errors ? resolve(data) : resolve(api.parseItems(data))
  }
  async excuteApiCommand(command){
    var excute = (resolve, reject) => {
      this.server.connect((conn)=>{
        let chan = conn.openChannel()
        conn.closeOnDone=true
        chan.write(command,()=>{
          chan.on('done', data =>{
            resolve(data)
          })
          .once('trap', trap =>{
            resolve(trap)
          })
          .once('error', error =>{
            resolve(error)
          })
        })
      })
    }
    return new Promise(excute);
  }
}
