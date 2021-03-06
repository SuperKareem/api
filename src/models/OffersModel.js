import logger from '../lib/logger'
import mongoose from 'mongoose'
export default function OffersModel(connection){
  var _offer = new mongoose.Schema({
    name: String,
    downloadSpeed: String,
    uploadSpeed: String,
    downloadLimit: String,
    uploadLimit: String,
    offerLifetime: Number,
    owner: String,
    networkId: String,
    offerPrice: Number,
    limitEndOffer: String,
  })
  return connection.model('offers', _offer)
}
