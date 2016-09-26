import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
var log = logger.debug
const mainCommand = '/ip/hotspot/user/'

class UsersClass {
  constructor ({ initialService, dbService }) {
    this.initialService = initialService
    this.db = dbService
  }
  filterData(user, methodType){
    let data = []
    if(methodType === "put"){
      !! user.currentUsername ? data.push(`=numbers=${user.currentUsername}`) : null
    } else if(methodType === "delete"){
      !! user.currentUsername ? data.push(`=numbers=${user.currentUsername}`) : null
      return data
    }
    !! user.username ? data.push(`=name=${user.username}`) : null
    !! user.password ? data.push(`=password=${user.password}`) : null
    !! user.profile ? data.push(`=profile=${user.profile}`) : null
    !! user.server ? data.push(`=server=${user.server}`) : null
    !! user.address ? data.push(`=address=${user.address}`) : null
    !! user.macAddress ? data.push(`=mac-address=${user.macAddress}`) : null
    !! user.email ? data.push(`=email=${user.email}`) : null
    !! user.routes ? data.push(`=routes=${user.routes}`) : null
    !! user.disabled ? data.push(`=disabled=${user.disabled}`) : null
    !! user.comment ? data.push(`=comment=${user.comment}`) : null
    return data
  }
  async getAllUsers(ctx) {
    let data = ctx.request.body
    if(!!data.owner && !! data.networkId){
      let network = await this.db.getAllUserNetworks(data.owner, data.networkId)
      await this.initialService.createMikrotikConnection(network)
      let users = await this.initialService.excuteGetCommand(mainCommand, 'print')
      ctx.ok(res.ok({data: users}))
    }else{
      ctx.ok(res.fail({errors: 'no network owner or networkId', data: {error: true}}))
    }
  }
  async addUser(ctx){
    log("adding user .. ")
    let user = ctx.request.body;
    log(user)
    let network = await this.db.getAllUserNetworks(user.owner, user.networkId)
    await this.initialService.createMikrotikConnection(network)
    let data = this.filterData(user, 'post');
    log(data)
    let r = await this.initialService.excutePostCommand(mainCommand, 'add', data);
    ctx.ok(!!r[0] && !!r[0].ret ? res.ok({msg: `${user.name} added successfuly`}) : res.fail({errors: r}))
  }

  async updateUser(ctx){
    log("updating user .. ")
    let user = ctx.request.body;
    let data = this.filterData(user, 'put');
    let res = await this.initialService.excutePostCommand(mainCommand, 'set', data);
    ctx.ok(!!res[0] && !!res[0].ret ? `${user.name} added successfuly` : res)
  }
  async deleteUser(ctx){

    log("Delteing user .. ")
    let user = ctx.request.body;
    let data = this.filterData(user, 'delete');
    let res = await this.initialService.excutePostCommand(mainCommand, 'remove', data);

    ctx.ok(res)
  }
}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(UsersClass)
  router.post('/api/mikrotik/users/get', api('getAllUsers'))
  router.post('/api/mikrotik/users', api('addUser'))
  router.delete('/api/mikrotik/users', api('deleteUser'))
  router.put('/api/mikrotik/users', api('updateUser'))
}
