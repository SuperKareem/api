import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
const broadbandCommand = '/ppp/profile/'
const mainCommand = '/ip/hotspot/user/profile/'
const IN_GB = 1073741824;

class ProfilesClass {
  constructor ({ initialService, dbService }) {
    this.initialService = initialService
    this.db = dbService
  }
  filterData(profile, methodType){
    let data = []
    if(methodType === "put"){
      !! profile.currentName ? data.push(`=numbers=${profile.currentName}`) : null
    } else if(methodType === "delete"){
      !! profile.currentName ? data.push(`=numbers=${profile.currentName}`) : null
      return data
    }
    !! profile.name ? data.push(`=name=${profile.name}`) : null
    !! profile.rateLimit ? data.push(`=rate-limit=${profile.rateLimit}`) : null
    if(methodType == "broadband"){
      return data
    }
    !! profile.addressPool ? data.push(`=address-pool=${profile.addressPool}`) : null
    !! profile.sessionTimeout ? data.push(`=session-timeout=${sessionTimeout.sessionTimeout}`) : null
    !! profile.idleTimeout ? data.push(`=idle-timeout=${profile.idleTimeout}`) : null
    !! profile.keepAliveTimeout ? data.push(`=keepalive-timeout=${profile.keepAliveTimeout}`) : null
    !! profile.macAddress ? data.push(`=mac-address=${profile.macAddress}`) : null
    !! profile.sharedUsers ? data.push(`=shared-users=${profile.sharedUsers}`) : null
    return data
  }
  getTrafficInGb(offers){
    offers.map(offer => {
      offer.downloadLimit = (offer.downloadLimit / IN_GB).toFixed(2)
      offer.uploadLimit = (offer.uploadLimit  / IN_GB).toFixed(2)
    })
  }
  async getAllProfiles(ctx) {
    let {owner, networkId} = ctx.request.body
    if(!!networkId){
      let network = await this.db.getAllUserNetworks(owner, networkId)
      await this.initialService.createMikrotikConnection(network)
      let offers = await this.db.getAllOffers(owner, networkId)
      this.getTrafficInGb(offers)
      ctx.ok(res.ok({data: offers}))
    }else{
      ctx.ok(res.fail({errors: 'no network owner or networkId', data: {error: true}}))
    }
  }
  async addProfile(ctx){
    logger.debug("adding profile .. ")
    let profile = ctx.request.body;
    let {owner, networkId} = ctx.request.body
    if(!!owner && !!networkId){
      let network = await this.db.getAllUserNetworks(owner, networkId)
      await this.initialService.createMikrotikConnection(network)
      profile.rateLimit = `${profile.downloadSpeed}/${profile.uploadSpeed}`
      let data = this.filterData(profile, 'post')
      let mkRes = await this.initialService.excutePostCommand(mainCommand, 'add', data);
      if(!!mkRes[0] && !!mkRes[0].ret){
        let data2 = this.filterData(profile, 'broadband')
        await this.initialService.createMikrotikConnection(network)
        let mkRes2 = await this.initialService.excutePostCommand(broadbandCommand, 'add', data2);
        profile.downloadLimit = profile.downloadLimit * IN_GB
        profile.uploadLimit = profile.uploadLimit * IN_GB
        let offer = await this.db.addNewOffer(profile)
        await this.db.addNewLog({
          action: 'add',
          user: 'admin',
          type: 'offer',
          networkId: networkId,
          data: profile.name
        })
        ctx.ok(res.ok({data: offer}))
      } else {
        ctx.ok(res.fail({errors: 'failed to addd profile to mikrotik server', data: {error: true}}))
      }
    } else {
      ctx.ok(res.fail({errors: 'no network owner or networkId', data: {error: true}}))
    }
    // ctx.ok(!!res[0] && !!res[0].ret ? `${profile.name} added successfuly` : res)
  }

  async updateProfile(ctx){
    logger.debug("updating profile .. ")
    let profile = ctx.request.body;
    let data = this.filterData(profile, 'put')
    let res = await this.initialService.excutePostCommand(mainCommand, 'set', data);
    await this.db.addNewLog({
      action: 'edit',
      user: 'admin',
      type: 'offer',
      networkId: networkId,
      data: profile.name
    })
    ctx.ok(!!res[0] && !!res[0].ret ? `${profile.name} added successfuly` : res)
  }
  async deleteProfile(ctx){
    logger.debug("Delteing profile .. ")
    let {profile, networkId, owner} = ctx.request.body;
    if(!!networkId && !!owner){
      // ctx.ok(res.fail({errors: 'netowrk does not exist !!'}))
      // return
    }
    let dbRes = await this.db.deleteProfile(profile);
    logger.debug(dbRes)
    profile.currentName = profile.name
    let data = this.filterData(profile, 'delete')
    logger.debug(data)
    let network = await this.db.getAllUserNetworks(owner, networkId)
    await this.initialService.createMikrotikConnection(network)
    let mkRes = await this.initialService.excutePostCommand(mainCommand, 'remove', data)
    logger.debug(mkRes)
    await this.db.addNewLog({
      action: 'delete',
      user: 'admin',
      type: 'offer',
      networkId: networkId,
      data: profile.name
    })
    ctx.ok(res.ok({msg: "deleted"}))
  }

}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(ProfilesClass)
  router.post('/api/mikrotik/users-profiles/get', api('getAllProfiles'))
  router.post('/api/mikrotik/users-profiles', api('addProfile'))
  router.delete('/api/mikrotik/users-profiles', api('deleteProfile'))
  router.put('/api/mikrotik/users-profiles', api('updateProfile'))
}
