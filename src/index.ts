/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-07-26 03:10:17
 * @modify date 2019-07-26 03:10:17
 * @desc [description]
 */
import * as utils from 'sardines-utils'

export interface RepositoryEntry {
    address: any
    driver: any
}

let entries: RepositoryEntry[] = []

export const requestRepoService = async (moduleName: string, service: string, ...args:any[]) => {
    const badEntries: RepositoryEntry[] = []
    for (let i = entries.length-1; i>=0; i--) {
        const entry = entries[i]
        try {
            const driverInstance = utils.Factory.getInstance(entry.driver, entry.address)
            if (driverInstance && driverInstance.invoke) {
                return await driverInstance.invoke({application: null, module: moduleName, service}, ...args)
            }
        } catch (e) {
            badEntries.push(entries.pop()!)
        }
    }
    Array.prototype.unshift.apply(entries, badEntries)
    return null
}
export const setup = (entries: RepositoryEntry[]) => {
    entries = entries.reverse()
}

export const isRemote = (application: string, moduleName: string, service: string):boolean => {
    return (application === '' && moduleName === '' && service === '')
}

export interface InvokeParameters {
    application: string
    module: string
    service: string
 }
export const invoke = (params: InvokeParameters, ...args: any[]) => {
    return params && args
}



