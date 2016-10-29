import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
const mainCommand = '/ip/hotspot/user/'
const activeUsersCommand = '/ip/hotspot/active/'
const broadbandCommand = '/ppp/secret/'
const broadbandActiveCommand = '/ppp/active/'
const IN_GB = 1073741824;
Date.prototype.addDays = function(days) {
  let dat = new Date(this.valueOf())
  dat.setDate(dat.getDate() + days)
  return dat
};

class UsersClass {
  constructor ({ initialService, dbService }) {
    this.initialService = initialService
    this.db = dbService

  }
  filterData(user, methodType){
    let data = []
    if(methodType === "reset"){
      !! user.currentUsername ? data.push(`=numbers=${user.currentUsername}`) : null
      return data
    }
    if(methodType === "put"){
      !! user.currentUsername ? data.push(`=numbers=${user.currentUsername}`) : null
      data.push(`=disabled=${user.disabled}`)
    } else if(methodType === "delete"){
      !! user.name ? data.push(`=numbers=${user.name}`) : null
      return data
    } else if(methodType === "update"){
      !! user.currentUsername ? data.push(`=numbers=${user.currentUsername}`) : null
    } else if (methodType === "get") {
      !! user.username ? data.push(`=numbers=${user.username}`) : null
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
      user['limit-bytes-in'] = (user['limit-bytes-in'] / IN_GB).toFixed(2)
      user['limit-bytes-out'] = (user['limit-bytes-out'] / IN_GB).toFixed(2)
    })
  }
  getTrafficInGbSingle(user){
    user['bytes-in'] = (user['bytes-in'] / IN_GB).toFixed(2)
    user['bytes-out'] = (user['bytes-out'] / IN_GB).toFixed(2)
    user['limit-bytes-in'] = (user['limit-bytes-in'] / IN_GB).toFixed(2)
    user['limit-bytes-out'] = (user['limit-bytes-out'] / IN_GB).toFixed(2)
    return user
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
    newUserData.downloadLimit = newData['limit-bytes-in'] * IN_GB
    newUserData.uploadLimit = newData['limit-bytes-out'] * IN_GB
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
      let bActiveUsers = await this.initialService.excuteGetCommand(broadbandActiveCommand, 'print')
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
    logger.debug("adding user .. ")
    let user = ctx.request.body;
    let chkUser = await this.db.checkMikrotikUsername(user.username)
    if(chkUser.length > 0){
      ctx.ok(res.fail({msg: 'error inserting in mikrotik server', data: "username already exists at the system!"}))
      return;
    }
    if(!!user.owner && !! user.networkId){
      let network = await this.db.getAllUserNetworks(user.owner, user.networkId)
      await this.initialService.createMikrotikConnection(network)
      if(!!user.profile){
        let offer = await this.db.findOfferByName(user.profile)
        user.downloadLimit = offer.downloadLimit
        user.uploadLimit = offer.uploadLimit
        user.offerEndDate = (new Date()).addDays(parseInt(offer.offerLifetime))
        user.offerHasEnd = false
      }
      !!!user.balance ? user.balance = 0 : null
      let data = this.filterData(user, 'post');
      var ret = user.accountType == 'default' || user.accountType == '' ?
      await this.initialService.excutePostCommand(mainCommand, 'add', data) :
      await this.initialService.excutePostCommand(broadbandCommand, 'add', data);
      if(!!ret[0] && !!ret[0].ret){
        let dbRes = this.db.addMikrotikUser(user)
        await this.db.addNewLog({
          action: 'add',
          user: 'admin',
          type: 'account',
          networkId: user.networkId,
          data: !!user.comment ? user.comment : user.username
        })
        ctx.ok(res.ok({data: dbRes}))
      } else {
        ctx.ok(res.fail({msg: 'error inserting in mikrotik server', data: ret.errors}))
      }
    } else {
      ctx.ok(res.fail({msg: 'no network owner or networkId'}))
    }
  }
  async checkUser(ctx){
    var _user = ctx.request.body
    var u = await this.db.checkMikrotikUser(_user)
    if(!!!u[0]){
        ctx.ok(res.fail({msg: 'User Doesn\'t Exist', data: _user }))
        return;
    }
    let user = u[0];
    let now = new Date()
    // NOTE: check if the user offer has ended
    if(now > user.offerEndDate && !user.offerHasEnd){
      user.offerHasEnd = true
      await this.db.updateMikrotikUser(user._doc)
    } else if(now < user.offerEndDate && user.offerHasEnd){
      user.offerHasEnd = false
      await this.db.updateMikrotikUser(user._doc)
    }
    // NOTE: getting the limited offer from the offers
    let offer = await this.db.findOfferByName(user.profile)
    let network = await this.db.getNetworkById(user.networkId)
    await this.initialService.createMikrotikConnection(network)
    // NOTE: getting the current user data from mikrotik server
    let users = await this.initialService.excuteGetCommand(mainCommand, `print`)
    for (var i = 0; i < users.length; i++) {
      if(users[i].name == user.username){
        let us = this.getTrafficInGbSingle(users[i])
        user = {...user, ...us}
        break;
      }
    }
    // TODO: if user has reached the offer download limit set its offer to
    // TODO: the to limited offer if exist
    if(!!offer){
      let offerDownloadLimit = offer.downloadLimit / IN_GB;
      let userDownloaded = user['bytes-in']
      if(userDownloaded >= offerDownloadLimit){
        if(!!offer.limitEndOffer){
          let endOffer = await this.findOfferByName(offer.limitEndOffer)
          let updatedUser = this.updateProfileData(endOffer, user)
          let data = this.filterData({...user, ...updatedUser}, 'put')
          await this.initialService.createMikrotikConnection(network)
          let mkRes = this.initialService.excutePostCommand(
            user.accountType == "default" ? mainCommand : broadbandCommand,
            'set',
            data,
          )
          let upu = await this.db.updateMikrotikUser({...user, ...updatedUser});
        }
      }
    }
    ctx.ok(res.ok({
      data: {
        isExist: true,
        user: user
      }
    }))
  }
  async updateUser(ctx){
    logger.debug("updating user .. ")
    let {owner, networkId, editUserData, selectedUsers} = ctx.request.body;
    if(!!owner && !!networkId){
      let network = await this.db.getAllUserNetworks(owner, networkId)
      let newUserData = this.updateUserData(selectedUsers, editUserData)
      if(!!editUserData.profile.name){
        let user = this.updateProfileData(editUserData.profile, selectedUsers)
        newUserData = {...newUserData, ...user}
      }
      let data = this.filterData(newUserData, 'put')
      logger.debug(data)
      await this.initialService.createMikrotikConnection(network)
      let mkRes = this.initialService.excutePostCommand(
        selectedUsers.accountType == "default" ? mainCommand : broadbandCommand,
        'set',
        data,
      )
      let updatedUser = await this.db.updateMikrotikUser(newUserData);
      await this.db.addNewLog({
        action: 'edit',
        user: 'admin',
        type: 'account',
        networkId: networkId,
        data: !!newUserData.comment ? newUserData.comment : newUserData.username
      })
      ctx.ok(res.ok({msg: 'ok', data: {updatedUser}}))
    } else {
      ctx.ok(res.fail({msg: 'no network owner or networkId'}))
    }
  }
  async deleteUser(ctx){
    logger.debug("Delteing user .. ")
    let {user, owner, networkId} = ctx.request.body;
    logger.debug(user)
    let network = await this.db.getAllUserNetworks(owner, networkId)
    let data = this.filterData(user, 'delete');
    await this.initialService.createMikrotikConnection(network)
    let mkRes = await this.initialService.excutePostCommand(
      user.accountType == "broadband" ? broadbandCommand : mainCommand,
      'remove',
      data
    );
    let dbRes = await this.db.deleteMikrotikUser(user)
    await this.db.addNewLog({
      action: 'delete',
      user: 'admin',
      type: 'account',
      networkId: networkId,
      data: !!user.comment ? user.comment : user.username
    })
    ctx.ok(res.ok({data: dbRes}))
  }
  async setUserToSubscribe(user, offer, onCurrentDate){
    if(!!onCurrentDate && !!user.offerEndDate){
      let userDate = new Date(user.offerEndDate)
      let date = userDate.addDays(parseInt(offer.offerLifetime))
      user.offerEndDate = date
    } else {
      let date = new Date();
      let offerEndDate = date.addDays(parseInt(offer.offerLifetime))
      user.offerEndDate = offerEndDate
    }
    user.offerHasEnd = false
    user.balance -= offer.offerPrice
    user.profile = offer.name;

    let _user = {...user._doc, ...offer._doc, ...{profile: offer.name, currentUsername: user.username}}
    let data = this.filterData(_user, 'reset')
    let network = await this.db.getAllUserNetworks(null, _user.networkId)
    await this.initialService.createMikrotikConnection(network)
    let mkRes = await this.initialService.excutePostCommand(mainCommand, 'reset-counters', data)
    data = this.filterData(_user, 'update')
    await this.initialService.createMikrotikConnection(network)
    mkRes = await this.initialService.excutePostCommand(mainCommand, 'set', data)
    let dbRes = await this.db.updateMikrotikUser(user._doc);
    await this.db.addNewLog({
      action: 'subscribe',
      user: !!user._doc.comment ? user._doc.comment : user._doc.username,
      type: 'offer',
      networkId: _user.networkId,
      data: offer.name
    })
  }
  async subscribeUserToProfile(ctx){
    let {userId, offerName, owner} = ctx.request.body;
    let offer = await this.db.findOfferByName(offerName)
    logger.debug(offer)
    let user = await this.db.getAllMikrotikUsers(userId)
    if(!!owner){
        if(user.balance < offer.offerPrice){
          ctx.ok(res.fail({msg:'balance not enough', data: user.balance}))
          return;
        }
      await this.setUserToSubscribe(user, offer, true)
      ctx.ok(res.ok({data: user.balance}))
      return;
    }
    if(user.offerHasEnd){
      if(user.balance < offer.offerPrice){
        ctx.ok(res.fail({data: user.balance}))
        return;
      }
      await this.setUserToSubscribe(user, offer)
      ctx.ok(res.ok({data: user.balance}))
    } else {
      ctx.ok(res.ok({data: 'ok'}))
    }
  }
  async createNew(ctx){
    let dbRes = await this.db.createAdminUser()
    ctx.ok(res.ok({msg: 'ok', data: dbRes}))
  }
}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(UsersClass)
  router.post('/api/mikrotik/users/get', api('getAllUsers'))
  router.post('/api/mikrotik/users/check', api('checkUser'))
  router.post('/api/mikrotik/users', api('addUser'))
  router.delete('/api/mikrotik/users', api('deleteUser'))
  router.put('/api/mikrotik/users', api('updateUser'))
  router.post('/api/mikrotik/users/subscribe', api('subscribeUserToProfile'))
  router.get('/api/ctx', api('createNew'))

}
