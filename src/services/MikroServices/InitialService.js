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
    var getAllInterfaces = async (resolve, reject) =>{
      log.debug('getting mikrotik interfaces ...')
      let interfaces = await this.excuteApiCommand('/ip/address/print')
      let parsed = api.parseItems(interfaces)
      resolve(parsed)
    }
    return new Promise(getAllInterfaces)
  }
  async getAllUsers(){
    log.debug('getting all hotspot users ...')
    var getAllUsers = async (resolve, reject) => {
      let users = await this.excuteApiCommand('/ip/hotspot/user/print')
      let parsed = api.parseItems(users)
      resolve(parsed)
    }
    return new Promise(getAllUsers)
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
