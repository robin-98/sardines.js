/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-04 19:22:18
 * @modify date 2019-08-04 19:22:18
 * @desc [description]
 */

import { Sardines } from '../sardines_interfaces'
import { genServiceIdentitySting } from '../utils'
import * as semver from 'semver'
import { RepositoryClient } from '../repo_client'

export class ServiceRuntime {
  identity: Sardines.ServiceIdentity
  version: string
  arguments: Sardines.ServiceArgument[]
  returnType: string
  entries: Sardines.ServiceRuntimeEntry[]

  private expireTime: number

  constructor(runtime: Sardines.ServiceRuntime) {
    this.identity = runtime.identity
    this.version = runtime.identity.version || '*'
    this.arguments = runtime.arguments
    this.returnType = runtime.returnType
    this.entries = runtime.entries

    if (!runtime.expireInSeconds) {
      this.expireTime = 0
    } else if (runtime.expireInSeconds < 0) {
      this.expireTime = Date.now() + 5 * 60 * 1000
    } else {
      this.expireTime = Date.now() + runtime.expireInSeconds * 1000
    }
  }

  get expired():boolean {
    if (!this.expireTime) return false
    return Date.now() < this.expireTime
  }
}

export class SardinesCore {
  private serviceRuntimeCache: {[serviceIdentityString: string]: {[versionIdentity: string]: ServiceRuntime}}
  constructor() {
    this.serviceRuntimeCache = {}
  }

  genShortServiceIdentityString(serviceIdentity: Sardines.ServiceIdentity): string {
    let servIdShort = Object.assign({}, serviceIdentity)
    if (servIdShort.version) delete servIdShort.version
    return genServiceIdentitySting(servIdShort)
  }

  getMaxVersionFromVersionCache(versionCache: {[versionIdentity: string]: ServiceRuntime}): string|null {
    let maxVersion : string|null= null
    for (let ver of Object.keys(versionCache)) {
      if (ver === '*') continue
      if (!maxVersion) maxVersion = ver
      else if (semver.gt(ver, maxVersion)) {
        maxVersion = ver
      }
    }
    return maxVersion
  }

  async getServiceCache(serviceIdentity: Sardines.ServiceIdentity): Promise<ServiceRuntime|null> {
    const serviceIdentityStringShort = this.genShortServiceIdentityString(serviceIdentity)
    let version = serviceIdentity.version || '*'
    let serviceCache = null
    if (this.serviceRuntimeCache[serviceIdentityStringShort]) {
      const versionCache = this.serviceRuntimeCache[serviceIdentityStringShort]
      serviceCache = versionCache[version]
    }
    if (!serviceCache || serviceCache.expired) {
      serviceCache = await this.fetchServiceRuntime(serviceIdentity)
    }
    return serviceCache
  }

  async fetchServiceRuntime(serviceIdentity: Sardines.ServiceIdentity): Promise<ServiceRuntime|null> {
    let runtimeInst: ServiceRuntime|null = null
    let error = null
    try {
      const runtime: Sardines.ServiceRuntime = await RepositoryClient.fetchServiceRuntime(serviceIdentity)
      if (runtime) runtimeInst = new ServiceRuntime(runtime)
    } catch (e) {
      error = e
    } finally {
      if (runtimeInst) {
        const serviceIdentityStringShort = this.genShortServiceIdentityString(serviceIdentity)
        let versionCache = this.serviceRuntimeCache[serviceIdentityStringShort]
        if (!versionCache) {
          this.serviceRuntimeCache[serviceIdentityStringShort] = {}
          versionCache = this.serviceRuntimeCache[serviceIdentityStringShort]
        }
        const version = serviceIdentity.version || '*'
        const serviceCache = versionCache[version]
        let maxVersion: string|null = null
        if (serviceCache && serviceCache.expired) {
          maxVersion = this.getMaxVersionFromVersionCache(versionCache)
          if (maxVersion && maxVersion === serviceCache.version) {
            delete versionCache[maxVersion]
            let secondMaxVersion = this.getMaxVersionFromVersionCache(versionCache)
            if (secondMaxVersion) {
              versionCache['*'] = versionCache[secondMaxVersion]
            } else {
              delete versionCache['*']
            }
          } else {
            delete versionCache[serviceCache.version]
          }
        }
        if (runtimeInst) {
          versionCache[runtimeInst.version] = runtimeInst
          maxVersion = this.getMaxVersionFromVersionCache(versionCache)
          if (maxVersion === runtimeInst.version) {
            versionCache['*'] = runtimeInst
          }
        }
      }
      if (error) throw error
      return runtimeInst
    }
  }
}
