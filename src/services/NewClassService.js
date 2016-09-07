const __classes = {
  // User 1's classes.
  1: [{
    id: 1,
    name: 'ES7 for Dummies'
  }, {
    id: 2,
    name: 'Koa 101'
  }],

  // User 2's classes
  2: [{
    id: 3,
    name: 'Dependency Injection with Awilix'
  }]
}
import logger from '../lib/logger'
export default class NewClassService {
  constructor ({ currentUser }) {
    this.currentUser = {
      id: 1
    }
  }

  find () {
    // gets the classes for the authenticated user.
    logger.debug(__classes[this.currentUser.id])
    return Promise.resolve(__classes[this.currentUser.id])
  }
}
