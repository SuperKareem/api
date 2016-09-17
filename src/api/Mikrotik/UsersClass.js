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
    let data = []
    !! user.username ? data.push(`=name=${user.username}`) : null
    !! user.password ? data.push(`=password=${user.password}`) : null
    !! user.profile ? data.push(`=profile=${user.profile}`) : null
    !! user.server ? data.push(`=server=${user.server}`) : null
    !! user.address ? data.push(`=address=${user.address}`) : null
    !! user.macAddress ? data.push(`=mac-address=${user.macAddress}`) : null
    !! user.email ? data.push(`=email=${user.email}`) : null
    !! user.routes ? data.push(`=routes=${user.routes}`) : null
    let res = await this.initialService.excutePostCommand(mainCommand, 'add', data);
    ctx.ok(!!res[0] && !!res[0].ret ? `${user.name} added successfuly` : res)
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
