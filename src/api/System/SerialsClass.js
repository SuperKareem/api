import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
var log = logger.debug

class SerialsClass{
  constructor({ dbService }) {
    this.db = dbService
  }
  async createSerials (ctx) {
    let { owner, networkId, serialsNumber, serialsPrice} = ctx.request.body;
    if(!!!owner && !!!networkId){
      ctx.ok(res.fail({msg: 'network not found'}))
      return;
    }
    let serials = []
    for (var i = 0; i < serialsNumber; i++) {
      let separator = '-'
      let length = 16;
      var license = new Array(length + 1).join((Math.random() + '00000000000000000').slice(2, 18)).slice(0, length);
      license = license.toUpperCase().replace(/(\w{4})/g, '$1' + separator).substr(0, length + Math.round(length/4)-1);
      logger.debug("lis   " + license)
      let serial = {
        license: license,
        price: serialsPrice,
        active: true
      }
      serials.push(serial);
    }
    let dbRes = await this.db.saveSerials(serials)
    ctx.ok(res.ok({msg: dbRes, data: serials}))
  }
  async addSerials(ctx){
    let {serials, serialsPrice, owner, networkId} = ctx.request.body;
    // TODO: check the network and the user existance
    // if(!!!owner && !!! networkId){
    //   ctx.ok(res.fail({msg: "netowrk not found"}))
    //   return;
    // }
    let _serials = [];
    serials.map((serial) => {
      let serialObj = {
        license: serial,
        price: serialsPrice,
        active: true
      }
      _serials.push(serialObj)
    })
    let dbRes = await this.db.saveSerials(_serials)
    ctx.ok(res.ok({msg: dbRes, data: _serials}))
  }
  async getSerials(ctx){
    let serials = await this.db.getSerials()
    ctx.ok(res.ok({msg: serials.length, data: serials}))
  }
  async chargeSerial(ctx){
    let {userId, serial} = ctx.request.body
    if(serial.length < 1){
      ctx.ok(res.fail({msg: "no serial sent", data: serial}))
      return;
    }
    let dbUser = await this.db.getAllMikrotikUsers(userId);
    let dbSerial = await this.db.getSerials(serial);
    if(!!!dbUser.id){
      ctx.ok(res.fail({msg: 'user does not exist!!'}))
    }
    if(!!!dbSerial){
      ctx.ok(res.fail({msg: 'serial does not exist!!'}))
      return;
    } else if(dbSerial.length > 1){
      ctx.ok(res.fail({msg: "more than serial exist !!", data: dbSerial}))
      return;
    }
    if(!dbSerial.active){
      ctx.ok(res.fail({msg: "serial is deactivated", data: dbSerial}))
      return;
    }
    await this.db.charge(dbSerial, dbUser)
    await this.db.addNewLog({
      action: 'charge',
      user: !!dbUser.comment ? dbUser.comment : dbUser.username,
      type: 'serial',
      networkId: dbUser.networkId,
      data: dbSerial.price
    })
    ctx.ok(res.ok({data: {serial: dbSerial}}))
  }
  async updateSerial(ctx){
    let {serial, newData, networkId} = ctx.request.body;
    let dbSerial = await this.db.getSerials(serial);
    if(dbSerial.length < 1){
      ctx.ok(res.fail({msg: 'serial not found', data: serial}))
      return;
    }
    dbSerial.license = newData.license;
    dbSerial.active = newData.active;
    dbSerial.price = newData.price;
    let dbRes = await this.db.updateSerial(dbSerial)
    await this.db.addNewLog({
      action: 'edit',
      user: 'admin',
      type: 'serial',
      networkId: networkId,
      data: newData.license
    })
    ctx.ok(res.ok({data: dbSerial}))
  }
  async deleteSerial(ctx){
    let {serial, networkId} = ctx.request.body;
    let dbRes = await this.db.deleteSerial(serial)
    await this.db.addNewLog({
      action: 'delete',
      user: 'admin',
      type: 'serial',
      networkId: networkId,
      data: serial.serial
    })
    ctx.ok(res.fail({data: dbRes}))
  }
}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(SerialsClass)
  router.post('/api/system/serials/create', api('createSerials'))
  router.post('/api/system/serials/add', api('addSerials'))
  router.post('/api/system/serials/charge', api('chargeSerial'))
  router.post('/api/system/serials', api('getSerials'))
  router.put('/api/system/serials', api('updateSerial'))
  router.delete('/api/system/serials', api('deleteSerial'))
}
