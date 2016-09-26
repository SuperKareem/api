import { makeClassInvoker } from 'awilix-koa'
import logger from '../../lib/logger'
import res from '../../lib/respond'
var log = logger.debug
class Users{
  constructor({ dbService }) {
    this.dbService = dbService
  }
  async checkUserExistance(ctx){
    var _user = ctx.request.body
    var user = await this.dbService.checkUserExistance(_user)
    if(user){
      ctx.ok(res.ok({
        data: {
          isExist: true,
          user: user
        }
      }))
    } else {
      ctx.ok(res.fail({errors: 'User Doesn\'t Exist', data: {isExist: false} }))
    }
  }
}
export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(Users)
  router.post('/api/system/users/check', api('checkUserExistance'))
  // router.post('/api/system/users-profiles', api('addProfile'))
  // router.delete('/api/system/users-profiles', api('deleteProfile'))
  // router.put('/api/system/users-profiles', api('updateProfile'))
}
