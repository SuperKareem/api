import mongoose from 'mongoose'
export default function UserModel(connection){
  var _user = new mongoose.Schema({
    username: String,
    password: String,
    role: String
  })
  return connection.model('users', _user)
}
