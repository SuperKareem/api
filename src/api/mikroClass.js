import { makeClassInvoker } from 'awilix-koa'
import logger from '../lib/logger'

class MikroClass {
  constructor ({ initialService }) {
    this.initialService = initialService
  }

  async getInterfaces(ctx) {
    let interfaces = await this.initialService.getInterfaces()
    logger.debug(interfaces)
    ctx.ok(interfaces)
  }
  async getAllUsers(ctx){
    let users = await this.initialService.getAllUsers();
    logger.debug(users)
    ctx.ok(users)
  }

  foo(ctx){
    let ok = {
      id: 'some Id',
      data: 'some data'
    }
    ctx.ok(ok)
  }
}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(MikroClass)
  router.get('/api/mikrotik/interfaces', api('getInterfaces'))
  router.get('/api/mikrotik/users', api('getAllUsers'))
}
