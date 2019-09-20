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
import { Source } from './npm_loader'


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
  
  let entries: Sardines.Entry[] = []
  let drivers: {[name: string]: any} = {}
  let platform: string = 'nodejs'

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
  
  export const setupRepositoryEntriesBySardinesConfig = (config: any) => {
    setupRepositoryEntries((<Sardines.Config>config!).repositoryEntries)
  }

  enum ArgumentType {
    body,
    args
  }
  const customArguments = (argType: ArgumentType, entry: Sardines.Entry, service: RepositoryService|string, ...args: any[]) => {
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
  
  const requestRepoServiceOnSingleEntry = async(entry: Sardines.Entry, service: RepositoryService|string, ...args: any[]):Promise<any> => {
      if (!repoServices[service]) {
        throw { type:'sardines', 'subType':'repository client', error:`unsupported repository action [${service}]`}
      }
      const pvdr = entry.providerInfo
      let driverName = pvdr.driver
      if (typeof driverName === 'object') {
        driverName = driverName[platform]
      }
      if (driverName === 'native-http') {
          let url = `${pvdr.host}${pvdr.port && pvdr.port !== 80? ':' + pvdr.port : ''}`
          url = `${url}/sardines/${sardineRepoModuleName}/${service}`.replace(/\/+/g, '/')
          url = `${pvdr.protocol}://${url}`
          let body = customArguments(ArgumentType.body, entry, service, ...args)
          let method = customMethod(service)
          let res:any = await fetch(url, {
              method,
              body: JSON.stringify(body),
              headers: { 'content-type': 'application/json'}
          })
          res = await res.text()
          let resJson = null
          try {
              resJson = JSON.parse(res)
          } catch (e) { }
          if (res === 'Invalid token' || res === 'token expired' || (resJson && ['token expired', 'Invalid token'].indexOf(resJson.error)>=0)) {
              await requestRepoServiceOnSingleEntry(entry, RepositoryService.signIn)
              return await requestRepoServiceOnSingleEntry(entry, service, ...args)
          } else if (res.toLowerCase() === 'not found' || res.toLowerCase() === 'method not allowed') {
              throw `Can not access service [${service}] at URL: ${url}`
          } else if (res && res.indexOf('error')>0) {
              res = JSON.parse(res)
              throw res
          } 
          if (service === RepositoryService.signIn || service === RepositoryService.signUp) {
              entry.token = res
              if (service === RepositoryService.signUp) {
                  entry.user = args[0]
                  entry.password = args[1]
              }
          } else  if (resJson && resJson.res !== undefined) {
              return resJson.res
          } else if (resJson) {
              return resJson
          }
          
          return res 
      } else if (typeof driverName === 'string' && drivers[driverName]) {
        const driverInst = Factory.getInstance(pvdr.driver, pvdr, 'driver')
        let serviceDefinition = repoServices[service]
        let customArgs: any[] = <any[]>customArguments(ArgumentType.args, entry, service, ...args)
        let res = await driverInst.invokeService(repoAppName, serviceDefinition, ...customArgs )
        let resObj = null
        switch (serviceDefinition.returnType) {
          case 'string': case 'number': case 'boolean':
            break
          default:
            resObj = res
            break
        }
        if (service === RepositoryService.signIn || service === RepositoryService.signUp) {
          entry.token = res
          if (service === RepositoryService.signUp) {
              entry.user = args[0]
              entry.password = args[1]
          }
        } 
        if (!resObj) return res
        else if (resObj.error) {
          throw resObj
        } else {
          return resObj
        }
      } else if (typeof driverName === 'string' && typeof drivers[driverName] === 'undefined') {
        try {
          let tmpDriverCatch: {[name:string]:any} = {}
          tmpDriverCatch[driverName] = await Source.getPackageFromNpm(driverName, Sardines.LocationType.npm, false)
          setupDrivers(tmpDriverCatch)
        } catch (e) {
          drivers[driverName] = false
          throw { type: 'sardines', 'subType': 'repository client', error: `can not load npm package for driver "${pvdr.driver}" at runtime`, rawErr: e}
        }
        return await requestRepoServiceOnSingleEntry(entry, service, ...args)
      } else {
        throw { type: 'sardines', 'subType': 'repository client', error: `no available driver for "${pvdr.driver}" on platform '${platform}'`}
      }
  }
  
  const requestRepoService = async (service: RepositoryService|string, ...args:any[]) => {
      const failedEntries: Sardines.Entry[] = []
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
    return await requestRepoService(RepositoryService.fetchServiceRuntime, serviceIdentity)
  }

  export const exec = async(serviceName: string, data: any) => {
    return await requestRepoService(serviceName, data)
  }

}
