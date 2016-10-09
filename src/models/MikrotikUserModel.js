import mongoose from 'mongoose'
export default function UserModel(connection){
  var _mikrotikUser = new mongoose.Schema({
    username: String,
    password: String,
    comment: String,
    email: String,
    profile: String,
    accountType: String,
    macAddress: String,
    mobile: String,
    currentOffer: String,
    balance: Number,
    offerHasEnd: Boolean,
  })
  return connection.model('mikrotikUser', _mikrotikUser)
}
