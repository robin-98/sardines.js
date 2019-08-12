/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-02 18:09:37
 * @modify date 2019-08-02 18:09:37
 * @desc [description]
 */
import { Sardines } from '../interfaces/sardines'
import { SardinesCore } from './CoreClass'
// import { RepositoryClient } from '../repo_client'
import * as utils from '../utils'
  
export namespace Core {
  const coreInst = new SardinesCore()

  export const isRemote = (application: string, moduleName: string, service: string):boolean => {
    return (application === '' && moduleName === '' && service === '')
  }
  
  export const invoke = async (serviceIdentity: Sardines.ServiceIdentity, ...args: any[]) => {
    // get local cache of the service
    console.log('invoking service:', serviceIdentity)
    try {
      let serviceRuntime = await coreInst.getServiceCache(serviceIdentity)
      if (!serviceRuntime) {
        throw utils.unifyErrMesg('Service runtime does not exist', 'sardines', 'runtime')
      }
    
    // if the cache has expired, or it's null, then request repository to fetch the service runtime info

    // invoke the service using its runtime info and return the result

      return serviceIdentity && args && serviceRuntime
    } catch (e) {
      console.log('error when invoking remote service:', e)
    }
    return null
  }
}
