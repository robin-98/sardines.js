/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-07-27 15:36:23
 * @modify date 2019-07-27 15:36:23
 * @desc [description]
 */
import * as fetch from 'isomorphic-fetch'
import { Sardines } from './interfaces/sardines'
import { Factory } from './factory'
import { Repository } from './repository_services'
import * as utils from './utils'

export namespace RepositoryClient {
  export const sardineAppName = 'sardines'
  export const sardineRepoModuleName = '/repository'

  export enum RepositoryService {
      signIn = 'signIn',
      signOut = 'signOut',
      signUp = 'signUp',
      queryService = 'queryService',
      createOrUpdateSource = 'createOrUpdateSource',
      createOrUpdateApplication = 'createOrUpdateApplication',
      createOrUpdateService = 'createOrUpdateService',
      fetchServiceRuntime = 'fetchServiceRuntime',
  }
  
  let repoAppName = Repository.application
  let repoServices: {[name: string]: Sardines.Service} = {}
  for (let service of Repository.services) {
    repoServices[service.name] = service
  }
 
  interface EntryCache extends Sardines.Entry {
    retryCount?: number
    nextRetryOn?: number
  }
  let entries: EntryCache [] = []
  let drivers: {[name: string]: any} = {}
  let platform: string = 'nodejs'

  export let remoteServices: Sardines.Runtime.ServiceCache = {}
  export let localServices: Sardines.Runtime.ServiceCache = {}
  
  export const setLocalServices = (localServiceCache: any) => {
    // deep copy cache
    if (!localServiceCache) return
    Sardines.Transform.mergeServiceCaches(localServices, localServiceCache)
  }

  export const setupPlatform = (p: string) => {
    platform = p
  }

  export const setupDrivers = (driverCache: {[name: string]: any}) => {
    for (let driverName in driverCache) {
      Factory.setClass(driverName, driverCache[driverName], 'driver')
      drivers[driverName] = true
    }
  }

  export const setupRepositoryEntries = (repoEntries: Sardines.Entry[]) => {
      if (!repoEntries || !Array.isArray(repoEntries) || repoEntries.length == 0) {
          throw 'Repository entry is empty'
      }
      entries = repoEntries.reverse()
  }
  
  export const setupRepositoryEntriesBySardinesConfig = (config: any, initDrivers: boolean = false) => {
    if (config.repositoryEntries) {
      setupRepositoryEntries(config.repositoryEntries)
    }
    if (config.platform) {
      setupPlatform(config.platform)
    }
    if (config.remoteServices) {
      remoteServices = config.remoteServices
    }
    if (initDrivers && config.drivers && config.drivers.length > 0) {
      const tmpDrivers: {[name: string]: any} = {}
      for (let driver of config.drivers) {
        if (driver.locationType && driver.name && !drivers[driver.name]) {
          if (driver.locationType === Sardines.LocationType.npm || driver.locationType === Sardines.LocationType.npm_link) {
            try {
              tmpDrivers[driver.name] = require(driver.name)
              if (tmpDrivers[driver.name] && tmpDrivers[driver.name].default) {
                tmpDrivers[driver.name] = tmpDrivers[driver.name].default
              }
            } catch(e) {
              console.error(`ERROR while loading ${driver.name}:`, e)
              throw `Can not load driver ${driver.name}`
            }
          }
        }
      }
      if (Object.keys(tmpDrivers).length > 0) {
        setupDrivers(tmpDrivers)
      }
    }
  }

  enum ArgumentType {
    body,
    args
  }
  const customArguments = (argType: ArgumentType, entry: EntryCache, service: RepositoryService|string, ...args: any[]) => {
    let body = { }, customArgs: any[] = []
    if (service === RepositoryService.signIn) {
      body = { account: {name: entry.user}, password: entry.password }
      customArgs = [{name: entry.user}, entry.password]
    } else if (service === RepositoryService.queryService) {
      body = { service: args[0], token: entry.token }
      customArgs = [args[0], entry.token]
    } else if (service === RepositoryService.signUp) {
      body = { username: args[0], password: args[1], token: entry.token}
      customArgs = [args[0], args[1], entry.token]
    } else if (service === RepositoryService.createOrUpdateSource) {
      body = { source: args[0], token: entry.token }
      customArgs = [args[0], entry.token]
    } else if (service === RepositoryService.createOrUpdateApplication) {
      body = { application: args[0], token: entry.token }
      customArgs = [args[0], entry.token]
    } else if (service === RepositoryService.createOrUpdateService) {
      body = { service: args[0], token: entry.token }
      customArgs = [args[0], entry.token]
    } else if (service === RepositoryService.fetchServiceRuntime) {
      body = { serviceIdentity: args[0], token: entry.token }
      customArgs = [args[0], entry.token]
    } else {
      body = {data: args[0], token: entry.token}
      customArgs = [args[0], entry.token]
    }
    if (argType === ArgumentType.args) return customArgs
    else return body
  }

  const customMethod = (service: RepositoryService|string) => {
    let method = 'post'
    if (service === RepositoryService.signIn || service === RepositoryService.signUp) method = 'put'
    else if (service === RepositoryService.signOut) method = 'get'
    return method
  }
  
  const requestRepoServiceOnSingleEntry = async(entry: EntryCache, service: RepositoryService|string, ...args: any[]):Promise<any> => {
      if (!repoServices[service]) {
        throw { type:'sardines', 'subType':'repository client', error:`unsupported repository action [${service}]`}
      }
      const pvdr = entry.providerInfo
      let driverName = pvdr.driver
      if (typeof driverName === 'object') {
        driverName = driverName[platform]
      }
      let resObj: any = null
      let err: any = null
      let res:any = null
      if (driverName === 'native-http') {
          let url = `${pvdr.host}${pvdr.port && pvdr.port !== 80? ':' + pvdr.port : ''}`
          url = `${url}/sardines/${sardineRepoModuleName}/${service}`.replace(/\/+/g, '/')
          url = `${pvdr.protocol}://${url}`
          let body = customArguments(ArgumentType.body, entry, service, ...args)
          let method = customMethod(service)
          const fetchRes = await fetch(url, {
              method,
              body: JSON.stringify(body),
              headers: { 'content-type': 'application/json'}
          })
          res = await fetchRes.text()
          try {
              resObj = JSON.parse(res)
          } catch (e) { }
          if (res.toLowerCase() === 'not found' || res.toLowerCase() === 'method not allowed') {
            err = utils.unifyErrMesg(`Service [${service}] does not exist at [${url}]`, 'sardines', 'repository client')
          } else if (resObj && resObj.error) {
            err = resObj
          }
      } else if (typeof driverName === 'string' && drivers[driverName]) {
        const driverInst = Factory.getInstance(pvdr.driver, pvdr, 'driver', utils.getKey(pvdr))
        let serviceDefinition = repoServices[service]
        let customArgs: any[] = <any[]>customArguments(ArgumentType.args, entry, service, ...args)
        try {
          serviceDefinition.application = repoAppName
          res = await driverInst.invokeService(Sardines.Transform.fromServiceToEmptyRuntime(serviceDefinition)!, ...customArgs)
          switch (serviceDefinition.returnType) {
            case 'string': case 'number': case 'boolean':
              break
            default:
              resObj = res
              break
          }
        } catch (e) {
          err = e
        }
      } else {
        err = utils.unifyErrMesg(`no available driver for "${pvdr.driver}" on platform '${platform}'`, 'sardines', 'repository client')
      } 
      
      // utils.inspectedLog({ res, resObj, err, entries})
      // process response
      if (res === 'Invalid token' || res === 'token expired'
        || (err && typeof err.error === 'string'
          && err.type === 'repository' && ['token expired', 'Invalid token'].indexOf(err.error)>=0)
          ) {
        const retryLimit = 3
        if (!entry.retryCount || entry.retryCount < retryLimit || !entry.nextRetryOn || Date.now() > entry.nextRetryOn) {
          if (!entry.retryCount || entry.retryCount >= retryLimit) {
            entry.retryCount = 0
          }
          if (!entry.retryCount) {
            entry.nextRetryOn = Date.now() + 1000 * 60 * 1
          }
          entry.retryCount++
          await utils.sleep(Math.round(Math.random() * 500 + 100))
          await requestRepoServiceOnSingleEntry(entry, RepositoryService.signIn)
          return await requestRepoServiceOnSingleEntry(entry, service, ...args)
        } else if (!err) {
          throw res 
        } else {
          throw err
        }
      } else if (err && err.error) {
        throw err 
      } else {
        // save token and password
        if (service === RepositoryService.signIn || service === RepositoryService.signUp) {
          entry.token = res
          if (service === RepositoryService.signUp) {
              entry.user = args[0]
              entry.password = args[1]
          }
        }
        if (resObj && resObj.res !== undefined) {
            return resObj.res
        } else if (resObj) {
            return resObj
        } else {
          return res
        }
      }
  }
  
  const requestRepoService = async (service: RepositoryService|string, ...args:any[]) => {
      const failedEntries: EntryCache[] = []
      let res = null, error = null, entriesError: {[key: number]: any} = {} 
      for (let i = entries.length-1; i>=0; i--) {
          const entry = entries[i]
          try {
              // Login first
              if (!entry.token) {
                  await requestRepoServiceOnSingleEntry(entry, RepositoryService.signIn)
              }
              res = await requestRepoServiceOnSingleEntry(entry, service, ...args)
              error = null
              break
          } catch (e) {
              failedEntries.push(entries.pop()!)
              error = e
              entriesError[i] = e
          }
      }
      Array.prototype.unshift.apply(entries, failedEntries)
      if (!error) return res 
      else {
        error = { type: 'sardines', subType: 'repository client', error: `All entries failed on service [${service}]`, entries: entriesError}
        throw error
      }
  }
  
  export const queryService = async (serviceIdentity:Sardines.ServiceIdentity) => {
      return await requestRepoService(RepositoryService.queryService, serviceIdentity)
  }
  
  export const createUser = async(username: string, password: string) => {
      return await requestRepoService(RepositoryService.signUp, username, password)
  }
  
  export const createOrUpdateSource = async(source: any) => {
      return await requestRepoService(RepositoryService.createOrUpdateSource, source)
  }
  
  export const createOrUpdateApplication = async( application: any) => {
      return await requestRepoService(RepositoryService.createOrUpdateApplication, application)
  }
  
  export const createOrUpdateService = async(service: any) => {
      return await requestRepoService(RepositoryService.createOrUpdateService, service)
  }

  export const fetchServiceRuntime = async(serviceIdentity: Sardines.ServiceIdentity) => {
    console.log('in repo_client, calling repsoitory for service runtime, service id:', serviceIdentity)
    return await requestRepoService(RepositoryService.fetchServiceRuntime, serviceIdentity)
  }

  export const exec = async(serviceName: string, data: any) => {
    return await requestRepoService(serviceName, data)
  }

}
