import { makeClassInvoker } from 'awilix-koa'
import log from '../../lib/logger'
import res from '../../lib/respond'

const mainCommand = '/ip/hotspot/user/profile/'

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
    !! profile.addressPool ? data.push(`=address-pool=${profile.addressPool}`) : null
    !! profile.sessionTimeout ? data.push(`=session-timeout=${sessionTimeout.sessionTimeout}`) : null
    !! profile.idleTimeout ? data.push(`=idle-timeout=${profile.idleTimeout}`) : null
    !! profile.keepAliveTimeout ? data.push(`=keepalive-timeout=${profile.keepAliveTimeout}`) : null
    !! profile.macAddress ? data.push(`=mac-address=${profile.macAddress}`) : null
    !! profile.sharedUsers ? data.push(`=shared-users=${profile.sharedUsers}`) : null
    !! profile.rateLimit ? data.push(`=rate-limit=${profile.rateLimit}`) : null
    return data
  }
  async getAllProfiles(ctx) {
    let {owner, networkId} = ctx.request.body
    if(!!owner && !!networkId){
      let network = await this.db.getAllUserNetworks(owner, networkId)
      await this.initialService.createMikrotikConnection(network)
      let profiles = await this.initialService.excuteGetCommand(mainCommand, 'print')
      log.debug(profiles)
      ctx.ok(res.ok({data: profiles}))
    }else{
      ctx.ok(res.fail({errors: 'no network owner or networkId', data: {error: true}}))
    }
  }

  async addProfile(ctx){
    log.debug("adding profile .. ")
    let profile = ctx.request.body;
    let data = this.filterData(profile, 'post')
    let res = await this.initialService.excutePostCommand(mainCommand, 'add', data);
    ctx.ok(!!res[0] && !!res[0].ret ? `${profile.name} added successfuly` : res)
  }

  async updateProfile(ctx){
    log.debug("updating profile .. ")
    let profile = ctx.request.body;
    let data = this.filterData(profile, 'put')
    let res = await this.initialService.excutePostCommand(mainCommand, 'set', data);
    ctx.ok(!!res[0] && !!res[0].ret ? `${profile.name} added successfuly` : res)
  }
  async deleteProfile(ctx){
    log.debug("Delteing profile .. ")
    let profile = ctx.request.body;
    let data = this.filterData(profile, 'delete')
    let res = await this.initialService.excutePostCommand(mainCommand, 'remove', data)
    ctx.ok(res)
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
