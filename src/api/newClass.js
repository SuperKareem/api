import { makeClassInvoker } from 'awilix-koa'
import logger from '../lib/logger'

class ClassesAPI {
  constructor ({ newClassService }) {
    this.newClassService = newClassService
  }

  async findClasses (ctx) {
    const classes = await this.newClassService.find()
    ctx.ok(classes)
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
  const api = makeClassInvoker(ClassesAPI)

  router.get('/api/newClass', api('foo'))
}
