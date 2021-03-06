import { listModules } from 'awilix'

/**
 * Resolves and creates API controllers.
 *
 * @param  {KoaRouter} router
 * The router to pass to the API factories.
 */
export default function createApis (router) {
  const result = listModules('../api/*.js', { cwd: __dirname })
  result.forEach(
    m => require(m.path).default(router)
  )
  const mikrotik = listModules('../api/mikrotik/*.js', { cwd: __dirname })
  mikrotik.forEach(
    m => require(m.path).default(router)
  )
  const system = listModules('../api/system/*.js', { cwd: __dirname })
  system.forEach(
    m => require(m.path).default(router)
  )
}
