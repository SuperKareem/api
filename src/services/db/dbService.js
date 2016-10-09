import logger from '../../lib/logger'
import UsersModel from '../../models/UsersModel'
import NetworksModel from '../../models/NetworksModel'
import MikrotikUserModel from '../../models/MikrotikUserModel'
import OffersModel from '../../models/OffersModel'
import mongoose from 'mongoose'

// const DB_NAME = 'mk2'
const DB_NAME = 'mksystem'
const DB_PORT = '27017'
const DB_HOST = `mongodb://localhost:${DB_PORT}/${DB_NAME}`
var log = logger.debug
export default class DbService {
  constructor () {
    this.createDbConnection()
  }
  createDbConnection(){
    this.connection = mongoose.createConnection(DB_HOST)
    log('// connected to database')
  }
  createAdminUser(){
    var usersModel = UsersModel(this.connection)
    var user = new usersModel();
    user.username = "admin"
    user.password = "123"
    user.role = 'client'
    user.save((err) => {
      !err ? log(`user ${user.username} has been created !!`) : log(err)
    })
  }

  async checkUserExistance(user){
    var usersModel = UsersModel(this.connection)
    log('... searching', user)
    var find = (resolve, reject) => {
      usersModel.find({
        username: user.username, password: user.password
      },(err, usr)=>{
        if(!err){
          if(!!usr[0])
            resolve(usr[0])
          else
            resolve(false)
        }else{
          log(err)
        }
      })
    }
    this.connection.close()
    return new Promise(find)
  }

  async addNewNetwork(network){
    !!this.connection.models ? this.createDbConnection() : null
    var save = (resolve, reject) => {
      var networkModel = NetworksModel(this.connection)
      var _network = new networkModel({...network})
      log('... adding user network')
      _network.save((err)=>{
        log('... new network has been added')
        !err ? resolve(network) : resolve(err)
        this.connection.close();
      })
    }
    return new Promise(save)
  }

  async addNewOffer(offer){
    var save = (resolve, reject) => {
      !!this.connection.models ? this.createDbConnection() : null
      var offerModel = OffersModel(this.connection)
      var _offer = new offerModel({...offer})
      console.log(_offer);
      log('... adding offer')
      _offer.save((err)=> {
        log('... new offer has been added')
        !err ? resolve(offer) : resolve(err)
      })
    }
    this.connection.close();
    return new Promise(save)
  }
// TODO: find offerbyname to add at userModel before saveing it
  async getAllOffers(owner, networkId){
    !!this.connection.models ? this.createDbConnection() : null
    var offerModel = OffersModel(this.connection)
    var find = (resolve, reject) => {
      offerModel.find({owner: owner, networkId: networkId}, (err, offers)=>{
        !err ? resolve(offers) : resolve(err)
      })
    }
    this.connection.close();
    return new Promise(find)
  }
  async findOfferByName(name){
    var find = (resolve, reject) => {
      !!this.connection.models ? this.createDbConnection() : null
      var offerModel = OffersModel(this.connection)
      offerModel.find({name: name}, (err, offers)=>{
        !err ? resolve(offers[0]) : resolve(err)
      })
      this.connection.close()
    }
    return new Promise(find)
  }

  async getAllUserNetworks(owner, networkId){
    !!this.connection.models ? this.createDbConnection() : null
    var netModel = NetworksModel(this.connection)
    var find = (resolve, reject) =>{
      !!networkId ?
      netModel.findById(networkId, (err, net)=>{
        !err? resolve(net) : resolve(err)
      }) :
      netModel.find({owner: owner},(err, nets)=>{
        !err ? resolve(nets) : resolve(err)
      })
    }
    this.connection.close()
    return new Promise(find)
  }

  async addMikrotikUser(mikrotikUser){
    !!this.connection.models ? this.createDbConnection() : null
    var save = (resolve, reject) => {
      let mikrotikUserModel = MikrotikUserModel(this.connection)
      let user = new mikrotikUserModel({...mikrotikUser})
      log('... adding mikrotikUser to db')
      user.save((err)=>{
        !err ? resolve(mikrotikUser) : resolve(err)
      })
    }
    this.connection.close();
    return new Promise(save)
  }
  async getAllMikrotikUsers(){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) => {
      let users = MikrotikUserModel(this.connection)
      users.find({}, (err, users)=> {
        !err ? resolve(users) : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(find)
  }
  async updateMikrotikUser(user){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) => {
      let dbUser = MikrotikUserModel(this.connection);
      dbUser.update({username: user.username}, {...user}, (err, number, raw)=>{
        !err ?  resolve(number) : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(find)
  }
  async deleteMikrotikUser(user){
    !!this.connection.models ? this.createDbConnection() : null
    var _de = (resolve, reject) => {
      let dbUser = MikrotikUserModel(this.connection)
      dbUser.remove({username: user.name}, (err)=>{
        !err ? resolve(err) : resolve("done")
      })
      this.connection.close();
    }
    return new Promise(_de)
  }
}
