import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
var log = logger.debug

class NetworksClass{
  constructor({ dbService }) {
    this.db = dbService
  }
  async addNewNetwork(ctx){
    let network = ctx.request.body
    await this.db.addNewNetwork(network)
    ctx.ok(res.ok({msg: 'network has been added successfully'}))
  }
  async getAllNetworks(ctx){
    let owner = ctx.request.body
    let nets = await this.db.getAllUserNetworks(owner.owner)
    !!nets.length > 0 ? ctx.ok(res.ok({data: nets})) : ctx.ok(res.ok({msg: 'no networks exists for this user'}))
  }
}
export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(NetworksClass)
  router.post('/api/system/networks/add', api('addNewNetwork'))
  router.post('/api/system/networks', api('getAllNetworks'))
}
