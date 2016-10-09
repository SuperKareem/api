import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
var log = logger.debug
const mainCommand = '/ip/hotspot/user/'
const activeUsersCommand = '/ip/hotspot/active/'
const broadbandCommand = '/ppp/secret/'
const broadbandActiveCommand = '/ppp/active/'
const IN_GB = 1073741824;

class UsersClass {
  constructor ({ initialService, dbService }) {
    this.initialService = initialService
    this.db = dbService
  }
  filterData(user, methodType){
    let data = []
    if(methodType === "put"){
      !! user.currentUsername ? data.push(`=numbers=${user.currentUsername}`) : null
      data.push(`=disabled=${user.disabled}`)
    } else if(methodType === "delete"){
      !! user.name ? data.push(`=numbers=${user.name}`) : null
      return data
    }
    !! user.username ? data.push(`=name=${user.username}`) : null
    !! user.password ? data.push(`=password=${user.password}`) : null
    !! user.profile ? data.push(`=profile=${user.profile}`) : null
    !! user.downloadLimit ? data.push(`=limit-bytes-in=${user.downloadLimit}`) : null
    !! user.uploadLimit ? data.push(`=limit-bytes-out=${user.uploadLimit}`) : null
    !! user.totalLimit ? data.push(`=limit-bytes-total=${user.totalLimit}`) : null
    !! user.routes ? data.push(`=routes=${user.routes}`) : null
    if(user.accountType == "broadband")
      !! user.service ? data.push(`=service=pppoe`) : null
    if(user.accountType != 'broadband'){
      !! user.server ? data.push(`=server=${user.server}`) : null
      !! user.address ? data.push(`=address=${user.address}`) : null
      !! user.macAddress ? data.push(`=mac-address=${user.macAddress}`) : null
      !! user.email ? data.push(`=email=${user.email}`) : null
      !! user.comment ? data.push(`=comment=${user.comment}`) : null
    }
    return data
  }

  getTrafficInGb(users){
    users.map(user => {
      user['bytes-in'] = (user['bytes-in'] / IN_GB).toFixed(2)
      user['bytes-out'] = (user['bytes-out'] / IN_GB).toFixed(2)
    })
  }
  async compineActiveUsers(activeUsers, users){
    await users.map(async (user, userIndex)=>{
      await activeUsers.map((active, activeIndex)=>{
        if(user.name == active.user){
          users[userIndex] = {...active, ...user, ...{active: true}}
        }
      })
    })
  }
  async compineDbUsers(dbUsers, users){
    await users.map(async (user, userIndex)=>{
      await dbUsers.map((dbUser, dbIndex)=>{
        if(user.name == dbUser.username){
          users[userIndex] = {...dbUser._doc, ...user}
        }
      })
    })
  }

  updateProfileData(profile, currentUser){
    let user = {...currentUser}
    user.downloadLimit = profile.downloadLimit * IN_GB
    user.uploadLimit = profile.uploadLimit * IN_GB
    user.profile = profile.name
    return user;
  }
  updateUserData(currentUser, newData){
    let newUserData = {...currentUser, ...newData}
    newUserData.currentUsername = currentUser.name;
    return newUserData;
  }

  async getAllUsers(ctx) {
    let data = ctx.request.body
    if(!!data.owner && !! data.networkId){
      let network = await this.db.getAllUserNetworks(data.owner, data.networkId)
      // NOTE: initialService
      await this.initialService.createMikrotikConnection(network)
      let users = await this.initialService.excuteGetCommand(mainCommand, 'print')
      // NOTE: initialService
      await this.initialService.createMikrotikConnection(network)
      let activeUsers = await this.initialService.excuteGetCommand(activeUsersCommand, 'print')
      await this.compineActiveUsers(activeUsers, users)
      // NOTE: initialService
      await this.initialService.createMikrotikConnection(network)
      let bUsers = await this.initialService.excuteGetCommand(broadbandCommand, 'print')
      // NOTE: initialService
      await this.initialService.createMikrotikConnection(network)
      let bActiveUsers = this.initialService.excuteGetCommand(broadbandActiveCommand, 'print')
      await this.compineActiveUsers(bActiveUsers, bUsers)
      users.push(...bUsers)
      // TODO: Get users names from db
      // NOTE: getting users from database
      let dbUsers = await this.db.getAllMikrotikUsers()
      await this.compineDbUsers(dbUsers, users)
      this.getTrafficInGb(users)
      ctx.ok(res.ok({data: users}))
    }else{
      ctx.ok(res.fail({errors: 'no network owner or networkId', data: {error: true}}))
    }
  }
  async addUser(ctx){
    log("adding user .. ")
    let user = ctx.request.body;
    if(!!user.owner && !! user.networkId){
      let network = await this.db.getAllUserNetworks(user.owner, user.networkId)
      await this.initialService.createMikrotikConnection(network)
      if(!!user.profile){
        let offer = await this.db.findOfferByName(user.profile)
        user.downloadLimit = offer.downloadLimit
        user.uploadLimit = offer.uploadLimit
      }
      let data = this.filterData(user, 'post');
      var ret = user.accountType == 'default' || user.accountType == '' ?
      await this.initialService.excutePostCommand(mainCommand, 'add', data) :
      await this.initialService.excutePostCommand(broadbandCommand, 'add', data);
      if(!!ret[0] && !!ret[0].ret){
        let dbRes = this.db.addMikrotikUser(user)
        ctx.ok(res.ok({data: dbRes}))
      } else {
        ctx.ok(res.fail({msg: 'error inserting in mikrotik server', data: ret.errors}))
      }
    } else {
      ctx.ok(res.fail({msg: 'no network owner or networkId'}))
    }
    // ctx.ok(!!r[0] && !!r[0].ret ? res.ok({msg: `${user.name} added successfuly`}) : res.fail({errors: r}))
  }

  async updateUser(ctx){
    log("updating user .. ")
    let {owner, networkId, editUserData, selectedUsers} = ctx.request.body;
    if(!!owner && !!networkId){
      let network = await this.db.getAllUserNetworks(owner, networkId)
      let newUserData = this.updateUserData(selectedUsers, editUserData)
      if(!!editUserData.profile.name){
        let user = this.updateProfileData(editUserData.profile, selectedUsers)
        newUserData = {...newUserData, ...user}
      }
      let data = this.filterData(newUserData, 'put')
      await this.initialService.createMikrotikConnection(network)
      let mkRes = this.initialService.excutePostCommand(
        selectedUsers.accountType == "default" ? mainCommand : broadbandCommand,
        'set',
        data,
      )
      let updatedUser = await this.db.updateMikrotikUser(newUserData);
      ctx.ok(res.ok({msg: 'ok', data: {updatedUser}}))
    } else {
      ctx.ok(res.fail({msg: 'no network owner or networkId'}))
    }
  }
  async deleteUser(ctx){
    log("Delteing user .. ")
    let {user, owner, networkId} = ctx.request.body;
    log(user)
    let network = await this.db.getAllUserNetworks(owner, networkId)
    let data = this.filterData(user, 'delete');
    await this.initialService.createMikrotikConnection(network)
    let mkRes = await this.initialService.excutePostCommand(
      user.accountType == "broadband" ? broadbandCommand : mainCommand,
      'remove',
      data
    );
    let dbRes = await this.db.deleteMikrotikUser(user)
    ctx.ok(res.ok({data: dbRes}))
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
