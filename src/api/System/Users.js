import { makeClassInvoker } from 'awilix-koa'
import log from '../../lib/logger'
var res = {
  errors: 0,
  data: {}
}
class Users{
  constructor({ dbService }) {
    this.dbService = dbService
  }
  async checkUserExistance(ctx){
    var _user = ctx.request.body
    var user = await this.dbService.checkUserExistance(_user)
    if(user.username == _user.username && user.password == _user.password){
      res.errors = 0
      res.data = {
        isExist: true,
        id: user._id
      }
      ctx.ok(res)
    } else {
      res.errors = 1,
      res.data = {
        isExist: false,
        error: 'user does not exist'
      }
      ctx.notFound(res)
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
