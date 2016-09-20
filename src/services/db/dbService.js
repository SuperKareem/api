import logger from '../../lib/logger'
import UsersModel from '../../models/UsersModel'
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
    user.save((err) => {
      !err ? log(`user ${this.user.username} has been created !!`) : log(err)
    })
  }
  async checkUserExistance(user){
    var usersModel = UsersModel(this.connection)
    log('... searching')
    var find = (resolve, reject) => {
      usersModel.find({
        username: user.username, password: user.password
      },(err, usr)=>{
        if(!err){
          if(!!usr[0])
            resolve(usr[0])
          else
            resolve("not Found")
        }else{
          log(err)
        }
      })
    }
    this.connection.close()
    return new Promise(find)
  }
}
