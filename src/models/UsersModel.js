import logger from '../lib/logger'
import mongoose from 'mongoose'
var log = logger.debug
export default function UserModel(connection){
  var _user = new mongoose.Schema({
    username: String,
    password: String
  })
  return connection.model('users', _user)
}
