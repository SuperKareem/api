import mongoose from 'mongoose'
export default function UserModel(connection){
  var _serial = new mongoose.Schema({
    license: String,
    active: Boolean,
    price: Number,
    date: {type: Date, default: Date.now},
    username: String,
    comment: String
  })
  return connection.model('serials', _serial)
}
