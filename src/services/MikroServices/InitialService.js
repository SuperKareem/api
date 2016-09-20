import log from '../../lib/logger'
import api from 'mikronode-ng'

export default class InitialService {
  constructor () {
    let mikroIP = '192.168.56.101';
    let username = 'admin';
    let password = '00'
    this.server = api.getConnection(mikroIP, username, password)
    log.debug(' .... connection established :) !!')
  }
  async excuteGetCommand(mainCommand, secondCommand){
    return new Promise(async (resolve, reject)=>{
      await this.getParsedData(resolve, reject, mainCommand + secondCommand)
    })
  }
  async excutePostCommand(mainCommand, secondCommand, data){
    let command  = [
      mainCommand+secondCommand,
      ...data
    ]
    return new Promise(async (resolve, reject)=>{
      await this.getParsedData(resolve, reject, command)
    })
  }
  // async getInterfaces(){
  //   return new Promise(async (resolve, reject)=>{
  //     await this.getParsedData(resolve, reject, '/ip/address/print')
  //   })
  // }
  // async getAllUsers(){
  //   return new Promise(async (resolve, reject)=>{
  //     await this.getParsedData(resolve, reject, '/ip/hotspot/user/print')
  //   })
  // }
  // async getActiveUsers(){
  //   return new Promise(async (resolve, reject)=>{
  //     await this.getParsedData(resolve, reject, '/ip/hotspot/active/print')
  //   })
  // }
  // async getUserProfiles(){
  //   return new Promise(async (resolve, reject)=>{
  //     await this.getParsedData(resolve, reject, '/ip/hotspot/active/print')
  //   })
  // }
  // async getAllHotspot(){
  //   return new Promise(async (resolve, reject)=>{
  //     await this.getParsedData(resolve, reject, '/ip/hotspot/print')
  //   })
  // }
  // async getAllQueues(){
  //   return new Promise(async (resolve, reject)=>{
  //     await this.getParsedData(resolve, reject, '/queue/simple/print')
  //   })
  // }
  async getParsedData(resolve, reject, command){
    let data = await this.excuteApiCommand(command)
    data.errors ? resolve(data) : resolve(api.parseItems(data))
  }
  async excuteApiCommand(command){
    var excute = (resolve, reject) => {
      this.server.connect((conn)=>{
        let chan = conn.openChannel()
        conn.closeOnDone = true
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
