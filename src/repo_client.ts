/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-07-27 15:36:23
 * @modify date 2019-07-27 15:36:23
 * @desc [description]
 */
import * as fetch from 'isomorphic-fetch'
import { Sardines } from './sardines_interfaces'

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
      fetchServiceRuntime = 'fetchServiceRuntime'
  }
  
  
  
  let entries: Sardines.RepositoryEntry[] = []
  
  export const setupRepositoryEntries = (repoEntries: Sardines.RepositoryEntry[]) => {
      if (!repoEntries || !Array.isArray(repoEntries) || repoEntries.length == 0) {
          throw 'Repository entry is empty'
      }
      entries = repoEntries.reverse()
  }
  
  export const setupRepositoryEntriesBySardinesConfig = (config: Sardines.Config) => {
    setupRepositoryEntries(config!.repositoryEntries)
  }
  
  const requestRepoServiceOnSingleEntry = async(entry: Sardines.RepositoryEntry, service: RepositoryService, ...args: any[]):Promise<any> => {
      const addr = entry.address
      const pvdr = addr.providerInfo
      if (addr.type === 'native-http') {
          let url = `${pvdr.host}${pvdr.port && pvdr.port !== 80? ':' + pvdr.port : ''}`
          url = `${url}/${sardineRepoModuleName}/${service}`.replace(/\/+/g, '/')
          url = `${pvdr.protocol}://${url}`
          let body = { }
          if (service === RepositoryService.signIn) {
            body = { account: {name: entry.user}, password: entry.password }
          } else if (service === RepositoryService.queryService) {
            body = { service: args[0], token: entry.token }
          } else if (service === RepositoryService.signUp) {
            body = { username: args[0], password: args[1], token: entry.token}
          } else if (service === RepositoryService.createOrUpdateSource) {
            body = { source: args[0], token: entry.token }
          } else if (service === RepositoryService.createOrUpdateApplication) {
            body = { application: args[0], token: entry.token }
          } else if (service === RepositoryService.createOrUpdateService) {
            body = { service: args[0], token: entry.token }
          } else if (service === RepositoryService.fetchServiceRuntime) {
            body = { serviceIdentity: args[0], token: entry.token }
          }
          let method = 'post'
          if (service === RepositoryService.signIn || service === RepositoryService.signUp) method = 'put'
          else if (service === RepositoryService.signOut) method = 'get'
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
      }
  }
  
  const requestRepoService = async (service: RepositoryService, ...args:any[]) => {
      const failedEntries: Sardines.RepositoryEntry[] = []
      let res = null
      for (let i = entries.length-1; i>=0; i--) {
          const entry = entries[i]
          try {
              // Login first
              if (!entry.token) {
                  await requestRepoServiceOnSingleEntry(entry, RepositoryService.signIn)
              }
              res = await requestRepoServiceOnSingleEntry(entry, service, ...args)
              break
          } catch (e) {
              console.error(`ERROR when requesting repository service [${service}]:`, e)
              failedEntries.push(entries.pop()!)
          }
      }
      Array.prototype.unshift.apply(entries, failedEntries)
      return res 
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
}
