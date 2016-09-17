import { makeClassInvoker } from 'awilix-koa'
import log from '../../lib/logger'

const mainCommand = '/ip/hotspot/user/'

class UsersClass {
  constructor ({ initialService }) {
    this.initialService = initialService
  }

  async getAllUsers(ctx) {
    let users = await this.initialService.excuteGetCommand(mainCommand, 'print')
    log.debug(users)
    ctx.ok(users)
  }
  async addUser(ctx){
    log.debug("adding user .. ")
    let user = ctx.request.body;
    let res = await this.initialService.excutePostCommand(mainCommand, 'add', [
      `=name=${user.name}`,
      `=password=${user.password}`,
      `=profile=${user.profile}`
    ])
    ctx.ok(res)
  }

  async deleteUser(ctx){
    log.debug("Delteing user .. ")
    let user = ctx.request.body;
    let res = await this.initialService.excutePostCommand(mainCommand, 'remove', [
      `=numbers=${user.name}`
    ])
    ctx.ok(res)
  }
}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(UsersClass)
  router.get('/api/mikrotik/users', api('getAllUsers'))
  router.post('/api/mikrotik/users', api('addUser'))
  router.delete('/api/mikrotik/users', api('deleteUser'))
}
