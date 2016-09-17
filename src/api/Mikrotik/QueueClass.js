import { makeClassInvoker } from 'awilix-koa'
import log from '../../lib/logger'

const mainCommand = '/queue/simple/'

class QueueClass {
  constructor ({ initialService }) {
    this.initialService = initialService
  }

  async getAllQueues(ctx) {
    let queues = await this.initialService.excuteGetCommand(mainCommand, 'print')
    log.debug(queues)
    ctx.ok(queues)
  }
  async addQueue(ctx){
    log.debug("adding queue")
  }

  async deleteQueue(ctx){
    log.debug("deleteing queue")
  }
}

export default function (router) {
  // Same trick as the functional API, but using `makeClassInvoker`.
  const api = makeClassInvoker(QueueClass)
  router.get('/api/mikrotik/queues', api('getAllQueues'))
  router.get('/api/mikrotik/queues/add', api('addQueue'))
  router.get('/api/mikrotik/queues/delete', api('deleteQueue'))
}
