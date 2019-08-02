/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-02 18:09:37
 * @modify date 2019-08-02 18:09:37
 * @desc [description]
 */
import { Sardines } from './sardines_interfaces'
export namespace Core {
  export const isRemote = (application: string, moduleName: string, service: string):boolean => {
    return (application === '' && moduleName === '' && service === '')
  }
  
  export const invoke = async (params: Sardines.InvokeParameters, ...args: any[]) => {
    return params && args
  }
}
