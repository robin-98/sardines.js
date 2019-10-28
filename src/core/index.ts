/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-02 18:09:37
 * @modify date 2019-08-02 18:09:37
 * @desc [description]
 */
import { Sardines } from '../interfaces'
import { SardinesCore } from './CoreInterface'
// import { RepositoryClient } from '../repo_client'
// import * as utils from '../utils'
  
export namespace Core {
  const coreInst = new SardinesCore()
  
  export const invoke = async (service: Sardines.Runtime.Service, ...args: any[]) => {
    return await coreInst.invoke(service, ...args)
  }
}
