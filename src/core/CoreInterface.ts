import { SardinesCoreRuntimeCache } from './CoreRuntimeCache'
import { Sardines } from '../interfaces/sardines'
import { RepositoryClient } from '../repo_client'
import { Factory } from '../factory'
import * as utils from '../utils'

export class SardinesCore extends SardinesCoreRuntimeCache {
  constructor() {
    super()
  }

  isRemote (application: string, moduleName: string, service: string):boolean {
    if (RepositoryClient.localServices
      && RepositoryClient.localServices[application]
      && RepositoryClient.localServices[application][moduleName]
      && RepositoryClient.localServices[application][moduleName][service]
      ) {
        return false
    } else if (RepositoryClient.remoteServices 
      && RepositoryClient.remoteServices[application]
      && RepositoryClient.remoteServices[application][moduleName]
      && RepositoryClient.remoteServices[application][moduleName][service]
    ) {
      return true
    }
    return true
  }

  async invoke(service: Sardines.Runtime.Service, ...args: any[]) {
    // console.log('invoking service')
    // utils.inspectedLog(service)
    if (service.entries && service.entries.length && service.entries[0].providerInfo && service.entries[0].providerInfo.driver) {
      const driverInst = Factory.getInstance(service.entries[0].providerInfo.driver, service.entries[0].providerInfo, 'driver', utils.getDriverKey(service.entries[0].providerInfo))
      // console.log('direct invoke', driverInst)
      return await driverInst.invokeService(service, ...args)
    } else if(service.identity && service.identity.application && service.identity.module && service.identity.name) {
      const serviceRuntime = await this.getService(service.identity)
      if (serviceRuntime) {
        const driverInst = Factory.getInstance(serviceRuntime.entries[0].providerInfo.driver, serviceRuntime.entries[0].providerInfo, 'driver', utils.getDriverKey(serviceRuntime.entries[0].providerInfo))
        // console.log('auto select invoke', driverInst)
        return await driverInst.invokeService(serviceRuntime, ...args)
      } else {
        throw utils.unifyErrMesg(`Can not fetch runtime for service`, 'core', 'invoke')
      }
    } else {
        throw utils.unifyErrMesg(`Unsupported service identification`, 'core', 'invoke')
    }
  }
}