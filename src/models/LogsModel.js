import mongoose from 'mongoose'
export default function UserModel(connection){
  var _logs = new mongoose.Schema({
    action: String,
    user: String,
    type: String,
    data: String,
    networkId: String,
    date: {type: Date, default: Date.now}
  })
  return connection.model('logs', _logs)
}
