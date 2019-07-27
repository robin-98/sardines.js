/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-07-26 03:10:17
 * @modify date 2019-07-26 03:10:17
 * @desc [description]
 */


export const isRemote = (application: string, moduleName: string, service: string):boolean => {
    return (application === '' && moduleName === '' && service === '')
}

export interface InvokeParameters {
    application: string
    module: string
    service: string
 }
export const invoke = async (params: InvokeParameters, ...args: any[]) => {
    return params && args
}

import * as Repository from './repository'
export { Repository }


