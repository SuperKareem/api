import mongoose from 'mongoose'
export default function NetworksModel(connection){
  var _network = new mongoose.Schema({
    owner: String,
    mikrotikIp: String,
    username: String,
    password: String,
    name: String
  })
  return connection.model('networks', _network)
}
