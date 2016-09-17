import { makeClassInvoker } from 'awilix-koa'
import log from '../../lib/logger'

const mainCommand = '/ip/address/'

class InterfaceClass {
  constructor ({ initialService }) {
    this.initialService = initialService
  }

  async getInterfaces(ctx) {
    let interfaces = await this.initialService.excuteGetCommand(mainCommand, 'print')
    ctx.ok(interfaces)
  }
  async addInterface(ctx){
    log.debug("adding interface")
  }

  async deleteInterface(ctx){
    log.debug("deleteing interface")
  }
}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(InterfaceClass)
  router.get('/api/mikrotik/interfaces', api('getInterfaces'))
  router.get('/api/mikrotik/interfaces/add', api('addInterface'))
  router.get('/api/mikrotik/interfaces/delete', api('deleteInterface'))
}
