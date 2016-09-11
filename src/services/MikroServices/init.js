import api from 'mikronode-ng'
import log from '../../lib/logger'

export default async function initialize(){
  var connect = (resolve, reject) => {
    log.debug('initializing ... ')
    var connection = api.getConnection('192.168.56.101','admin','00')
    connection.connect((conn)=>{
      var chan = conn.openChannel()
      chan.closeOnDone = true
      resolve(chan)
    })
  }
  return new Promise(connect)
}
