import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
var log = logger.debug
const mainCommand = '/log/'
class LogsClass{
  constructor({ dbService, initialService }) {
    this.db = dbService
    this.initialService = initialService
  }
  async getAllLogs(ctx){
    let {owner, networkId} = ctx.request.body
    let logs = await this.db.getAllLogs(networkId)
    ctx.ok(res.ok({data: logs}))
    // !!logs.length > 0 ? ctx.ok(res.ok({data: logs})) : ctx.ok(res.fail({msg: 'no logs exists for this user'}))
  }
  async getMikrotikLogs(ctx){
    let {user, owner, networkId} = ctx.request.body;
    let network = await this.db.getAllUserNetworks(owner, networkId)
    await this.initialService.createMikrotikConnection(network)
    let mkRes = await this.initialService.excuteGetCommand(mainCommand, 'print')
    ctx.ok(res.ok({data: mkRes.slice(0,300)}))
  }
}
export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(LogsClass)
  router.post('/api/system/logs/sys/', api('getAllLogs'))
  router.post('/api/system/logs/mikro/', api('getMikrotikLogs'))
}
