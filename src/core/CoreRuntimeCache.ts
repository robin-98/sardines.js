/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-04 19:22:18
 * @modify date 2019-08-04 19:22:18
 * @desc [description]
 */

import { Sardines } from '../interfaces/sardines'
import { genServiceIdentitySting } from '../utils'
import { RepositoryClient } from '../repo_client'
import * as utils from '../utils'

export interface ServiceRuntime extends Sardines.Runtime.Service {
  expireTime?: number
}

  const hasServiceRuntimeExpired = (runtime: ServiceRuntime):boolean => {
    if (!runtime.expireTime) return false
    return Date.now() < runtime.expireTime
  }

export class SardinesCoreRuntimeCache {
  private serviceRuntimeCache: {[serviceIdentityString: string]: {[versionIdentity: string]: ServiceRuntime|null}}
  constructor() {
    this.serviceRuntimeCache = {}
  }

  genShortServiceIdentityString(serviceIdentity: Sardines.ServiceIdentity): string {
    let servIdShort = Object.assign({}, serviceIdentity)
    if (servIdShort.version) delete servIdShort.version
    return genServiceIdentitySting(servIdShort)
  }

  async fetchServiceRuntime(serviceIdentity: Sardines.ServiceIdentity): Promise<ServiceRuntime|null> {
    let runtimeInst: ServiceRuntime|null = null
    const serviceQuery: {[key:string]:any} = Object.assign({}, serviceIdentity)
    for (let prop of ['providerInfo', 'providerSettings', 'service_id', 'id']) {
      if (serviceQuery[prop]) delete serviceQuery[prop]
    }
    console.log('before requesting repository client to fetch service runtime for:', serviceIdentity)
    const runtime: Sardines.Runtime.Service = await RepositoryClient.fetchServiceRuntime(serviceIdentity)
    console.log('result of fetching:', runtime)
    if (runtime) {
      if (runtime.entries && runtime.entries.length && runtime.entries[0].providerInfo && runtime.entries[0].providerInfo.driver
        && runtime.identity && runtime.identity.application && runtime.identity.module && runtime.identity.name && runtime.identity.version
        ) {
        runtimeInst = runtime
        if (runtime.expireInSeconds) {
          runtimeInst.expireTime = Date.now() + runtime.expireInSeconds*1000
        } else {
          runtimeInst.expireTime = Date.now() + 1000*86400*365*1000
        }
      } else {
        throw utils.unifyErrMesg(`Invalid runtime data structure returned from repository for service [${serviceIdentity.application}:${serviceIdentity.module}:${serviceIdentity.name}:${serviceIdentity.version}]`, 'core', 'fetch service runtime')
      }
    }
    return runtimeInst
  }

  setServiceCache(serviceIdentity: Sardines.ServiceIdentity, runtimeInst: ServiceRuntime|null) {
    const serviceIdentityStringShort = this.genShortServiceIdentityString(serviceIdentity)
    if (!this.serviceRuntimeCache[serviceIdentityStringShort]) {
      this.serviceRuntimeCache[serviceIdentityStringShort] = {}
    }
    if (runtimeInst) {
      this.serviceRuntimeCache[serviceIdentityStringShort][runtimeInst.identity.version||'*'] = runtimeInst
    }
    this.serviceRuntimeCache[serviceIdentityStringShort][serviceIdentity.version || '*'] = runtimeInst
  }

  async getService(serviceIdentity: Sardines.ServiceIdentity): Promise<ServiceRuntime|null> {
    if (!serviceIdentity||!serviceIdentity.application||!serviceIdentity.module||!serviceIdentity.name) return null
    const serviceIdentityStringShort = this.genShortServiceIdentityString(serviceIdentity)
    let version = serviceIdentity.version || '*'
    if (!this.serviceRuntimeCache[serviceIdentityStringShort]) {
      this.serviceRuntimeCache[serviceIdentityStringShort] = {}  
    }
    let serviceCache = this.serviceRuntimeCache[serviceIdentityStringShort][version]
    if (!serviceCache || hasServiceRuntimeExpired(serviceCache)) {
      console.log('going to fetch service runtime')
      serviceCache = await this.fetchServiceRuntime(serviceIdentity)
      console.log('service identity:', serviceIdentity)
      console.log('service cache:', serviceCache)
      console.log('here')
      this.setServiceCache(serviceIdentity, serviceCache)
    }
    if (!serviceCache) {
      throw utils.unifyErrMesg(`Can not find service runtime instance for ${serviceIdentity.application}:${serviceIdentity.module}:${serviceIdentity.name}:${serviceIdentity.version}`, 'core', 'get service runtime cache')
    }
    return serviceCache
  }
}
