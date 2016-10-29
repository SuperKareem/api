import logger from '../../lib/logger'
import UsersModel from '../../models/UsersModel'
import NetworksModel from '../../models/NetworksModel'
import MikrotikUserModel from '../../models/MikrotikUserModel'
import OffersModel from '../../models/OffersModel'
import SerialsModel from '../../models/SerialsModel'
import LogsModel from '../../models/LogsModel'
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
    !!this.connection.models ? this.createDbConnection() : null
    var create = (resolve, reject) =>{
      var usersModel = UsersModel(this.connection)
      var user = new usersModel();
      user.username = "admin"
      user.password = "123"
      user.role = 'client'
      user.save((err) => {
        !err ? resolve(`user ${user.username} has been created !!`) : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(create)
  }

  async checkUserExistance(user){
    !!this.connection.models ? this.createDbConnection() : null
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
  // NOTE: Networks
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
  async getAllNetworks(){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) =>{
      var netModel = NetworksModel(this.connection)
      netModel.find({},(err, nets)=>{
        !err ? resolve(nets) : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(find)
  }
  async getNetworkById(networkId){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) => {
      let dbNetwork = NetworksModel(this.connection)
      dbNetwork.findById(networkId, (err, network)=>{
        !err ? resolve(network) : reslove(err)
      })
      this.connection.close()
    }
    return new Promise(find)
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
      offerModel.find({networkId: networkId}, (err, offers)=>{
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
  async deleteProfile(profile){
    !!this.connection.models ? this.createDbConnection() : null
    let remove = (resolve, reject) => {
      var offerModel = OffersModel(this.connection)
      offerModel.remove({name: profile.name}, (err)=> {
        !err ? resolve("deleted") : resolve(err)
      })
    }
    return new Promise(remove)
  }
  // NOTE: MikrotikUsers
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
  async getAllMikrotikUsers(userId){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) => {
      let users = MikrotikUserModel(this.connection)
      users.find({}, (err, users)=> {
        !err ? resolve(users) : resolve(err)
      })
      this.connection.close();
    }
    var findById = (resolve, reject) =>{
      let _user = MikrotikUserModel(this.connection)
      _user.findById(userId, (err, user) => {
        !err ? resolve(user) : resolve(err)
      })
    }
    return new Promise(!!userId ? findById : find)
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
        !err ? resolve("deleted") : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(_de)
  }
  async checkMikrotikUser({username, password}){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) => {
      let dbUser = MikrotikUserModel(this.connection)
      dbUser.find({username:  username, password: password}, (err, user)=> {
        !err ? resolve(user) : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(find)
  }
  async checkMikrotikUsername(username){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) => {
      let dbUser = MikrotikUserModel(this.connection)
      dbUser.find({username:  username}, (err, user)=> {
        !err ? resolve(user) : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(find)
  }
  // NOTE: serials functions
  async saveSerials(serials){
    !!this.connection.models ? this.createDbConnection() : null
    log(serials)
    var save = (resolve, rejcet) => {
      let dbSerials = SerialsModel(this.connection)
      dbSerials.create(serials, (err) => {
        !err ? resolve("done") : resovle(err)
      })
      this.connection.close();
    }
    return new Promise(save)
  }
  async getSerials(serial){
    !!this.connection.models ? this.createDbConnection() : null
    var find = (resolve, reject) => {
      let dbSerials = SerialsModel(this.connection)
      dbSerials.find({}, (err, serials) => {
        !err ? resolve(serials) : resolve(err)
      })
    }
    var findSerial = (resolve, reject) => {
      let dbSerials = SerialsModel(this.connection)
      dbSerials.find({license: !!serial.license ? serial.license : serial}, (err, serials) => {
        !err && serials.length <= 1 ? resolve(serials[0]) : resolve({error: err, serials: serials})
      })
    }
    return new Promise(!!serial ? findSerial : find)
  }
  async charge(serial, user){
    !!this.connection.models ? this.createDbConnection() : null
    serial.active = false;
    serial.username = user.username;
    serial.comment = user.comment;
    user.balance = user.balance + serial.price;
    await serial.save((err)=>{
      !err ? log("serialSaved") : log(err)
    })
    await user.save((err)=>{
      !err ? log("serialSaved") : log(err)
    })
  }
  async updateSerial(dbSerial){
    !!this.connection.models ? this.createDbConnection() : null
    var save = (resolve, reject) => {
      dbSerial.save((err)=>{
        !err ? resolve("updated") : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(save)
  }
  async deleteSerial(serial){
    !!this.connection.models ? this.createDbConnection() : null
    let remove = (resolve, reject) => {
      let dbSerial = SerialsModel(this.connection)
      dbSerial.remove({license: serial.license},(err)=>{
        !err? resolve({serial: serial, removed: true}) : resolve(err)
      })
      this.connection.close()
    }
    return new Promise(remove)
  }
  // NOTE: Logs functions
  async addNewLog(log = {action, user, type, data}){
    !!this.connection.models ? this.createDbConnection() : null
    let save = (resolve, reject) => {
      let dbLogs = LogsModel(this.connection)
      let _log = new dbLogs(log);
      _log.save((err)=>{
        !err ? resolve("log saved successfuly") : resolve(err)
      })
      this.connection.close();
    }
    return new Promise(save)
  }
  async getAllLogs(networkId){
    !!this.connection.models ? this.createDbConnection() : null
    let find = (resolve, rejec) => {
      let dbLogs = LogsModel(this.connection)
      dbLogs.find({networkId: networkId}, (err, logs) => {
        !err ? resolve(logs) : resolve(err)
      })
      this.connection.close()
    }
    return new Promise(find)
  }
}
