import logger from '../../lib/logger'
import UsersModel from '../../models/UsersModel'
import NetworksModel from '../../models/NetworksModel'
import mongoose from 'mongoose'

const DB_NAME = 'mksystem'
const DB_PORT = '27017'
const DB_HOST = `mongodb://localhost:${DB_PORT}/${DB_NAME}`
var log = logger.debug
export default class DbService {
  constructor () {
    this.connection = mongoose.createConnection(DB_HOST)
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
    var networkModel = NetworksModel(this.connection)
    var _network = new networkModel()
    log('... adding user network')
    _network.mikrotikIp = network.mikrotikIp
    _network.username = network.username
    _network.password = network.password
    _network.owner = network.owner
    _network.name = network.networkName
    console.log(network);
    _network.save((err)=>{
      !err ? log('network added !!' + _network) : log(err)
    })
  }
  async getAllUserNetworks(owner, networkId){
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
    return new Promise(find)
  }
}
