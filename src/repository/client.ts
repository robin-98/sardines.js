/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-07-27 15:36:23
 * @modify date 2019-07-27 15:36:23
 * @desc [description]
 */
import * as utils from 'sardines-utils'
import fetch from 'node-fetch'

export interface RepositoryEntry {
    address: any
    driver: any
}

let entries: RepositoryEntry[] = []

export const requestRepoService = async (moduleName: string, service: string, ...args:any[]) => {
    const badEntries: RepositoryEntry[] = []
    let res = null
    for (let i = entries.length-1; i>=0; i--) {
        const entry = entries[i]
        try {
            const driverInstance = utils.Factory.getInstance(entry.driver, entry.address)
            if (driverInstance && driverInstance.invoke) {
                res = await driverInstance.invoke({application: null, module: moduleName, service}, ...args)
                break
            } else {
                throw 'bad driver'
            }
        } catch (e) {
            if (e !== 'bad driver' && e.message !== 'bad driver') {
                badEntries.push(entries.pop()!)
            } else {
                entries.pop()
            }
        }
    }
    Array.prototype.unshift.apply(entries, badEntries)
    return res 
}
export const setup = (entries: RepositoryEntry[]) => {
    entries = entries.reverse()
}


export const loginRepository = async(repoUrl: string, username: string, password: string) => {
    if (!repoUrl) throw utils.unifyErrMesg('repository url is missing', 'sardines', 'publisher')
    if (!username) throw utils.unifyErrMesg('repository username is missing', 'sardines', 'publisher')
    if (!password) throw utils.unifyErrMesg('repository password is missing', 'sardines', 'publisher')
    try {
        let res:any = await fetch(`${repoUrl}/repository/signIn`, {
            method: 'put',
            body: JSON.stringify({ account: { name: username }, password }),
            headers: { 'content-type': 'application/json'}
        })
        res = await res.text()
        if (res && res.indexOf('error')>0) {
            res = JSON.parse(res)
        }
        return res
    } catch (e) {
        throw utils.unifyErrMesg(e, 'sardines', 'publisher login')
    }
}

export const signUpRepository = async(repoUrl: string, username: string, password: string) => {
    if (!repoUrl) throw utils.unifyErrMesg('repository url is missing', 'sardines', 'publisher')
    if (!username) throw utils.unifyErrMesg('repository username is missing', 'sardines', 'publisher')
    if (!password) throw utils.unifyErrMesg('repository password is missing', 'sardines', 'publisher')
    try {
        let res:any = await fetch(`${repoUrl}/repository/signUp`, {
            method: 'put',
            body: JSON.stringify({ account: { name: username }, password }),
            headers: { 'content-type': 'application/json'}
        })
        res = await res.text()
        if (res && res.indexOf('error')>0) {
            res = JSON.parse(res)
            throw res
        } 
        return res
    } catch (e) {
        throw utils.unifyErrMesg(e, 'sardines', 'publisher sign up')
    }
}

export const createOrUpdateSource = async(repoUrl: string, source: any, token: string) => {
    try {
        let res:any = await fetch(`${repoUrl}/repository/createOrUpdateSource`, {
            method: 'POST',
            body: JSON.stringify({ source, token }),
            headers: { 'content-type': 'application/json'}
        })
        res = await res.text()
        res = JSON.parse(res)
        if (res && res.error) {
            throw res
        } 
        return res
    } catch (e) {
        throw utils.unifyErrMesg(e, 'sardines', 'publisher update source info')
    }
}

export const createOrUpdateApplication = async(repoUrl: string, application: any, token: string) => {
    try {
        let res:any = await fetch(`${repoUrl}/repository/createOrUpdateApplication`, {
        method: 'POST',
        body: JSON.stringify({ application, token }),
        headers: { 'content-type': 'application/json'}
    })
        res = await res.text()
        res = JSON.parse(res)
        if (res && res.error) {
            throw res
        } 
        return res
    } catch (e) {
        throw utils.unifyErrMesg(e, 'sardines', 'publisher update application info')
    }
}

export const createOrUpdateService = async(repoUrl: string, service: any, token: string) => {
    try {
        let res:any = await fetch(`${repoUrl}/repository/createOrUpdateService`, {
            method: 'POST',
            body: JSON.stringify({ service, token }),
            headers: { 'content-type': 'application/json'}
        })
        res = await res.text()
        res = JSON.parse(res)
        if (res && res.error) {
            throw res
        } 
        return res
    } catch (e) {
        throw utils.unifyErrMesg(e, 'sardines', 'publisher update service info')
    }
}