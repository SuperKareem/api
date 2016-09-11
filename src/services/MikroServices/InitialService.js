import log from '../../lib/logger'
import api from 'mikronode-ng'

export default class InitialService {
  constructor () {
    let mikroIP = '192.168.56.101';
    let username = 'admin';
    let password = '00'
    this.server = api.getConnection(mikroIP, username, password)
    log.debug('logged in .... connection established :) !!')
  }

  async getInterfaces(){
    return new Promise(async (resolve, reject)=>{
      await this.getParsedData(resolve, reject, '/ip/address/print')
    })
  }
  async getAllUsers(){
    return new Promise(async (resolve, reject)=>{
      await this.getParsedData(resolve, reject, '/ip/hotspot/user/print')
    })
  }
  async getParsedData(resolve, reject, command){
    let data = await this.excuteApiCommand(command)
    let parsed = api.parseItems(data)
    resolve(parsed)
  }
  async excuteApiCommand(command){
    var excute = (resolve, reject) => {
      this.server.connect((conn)=>{
        let chan = conn.openChannel()
        conn.closeOnDone = true
        chan.write(command,()=>{
          chan.on('done',(data)=>{
            resolve(data)
          })
          .once('trap', (trap)=>{
            log.debug('trap !! ::', trap)
          })
          .once('error', (error)=>{
            log.debug('error !! ::', error)
          })
        })
      })
    }
    return new Promise(excute);
  }
}
