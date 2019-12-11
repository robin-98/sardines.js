/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-05-08 15:53:04
 * @modify date 2019-06-13 15:53:04
 * @desc common utilities for sardines.js project
 */
import * as nodeUtil from 'util'
import * as proc from 'process'
import { Sardines } from './interfaces/sardines'

// 2019-05-09
export interface UnifiedErrorMessage {
  error: any
  type: string
  subType: string
  [key: string]: any
}
export const unifyErrMesg = (err: any, type: string = 'unknown', subType: string = 'unknown'): UnifiedErrorMessage => {
  let result = err
  if (typeof err === 'object') {
      if (err.error === undefined) {
          if (err.message) {
              if (proc.env.NODE_ENV && ['prod', 'production'].indexOf(proc.env.NODE_ENV.toLowerCase()) >=0) {
                  result = { error: err.message, type, subType }
              } else {
                  result = Object.assign({}, err, { error: err.message, type, subType })
              }
          } else {
              result = { error: err, type, subType }
          }
      } else {
          result = Object.assign({ type, subType }, err)
      }
  } else {
      result = { error: err, type, subType }
  }
  return result
}

// 2019-06-25
export const unifyAsyncHandler = (type: string, subType: string, handler:any, thisObj:any = null, msg:string = '') => {
  return async (...params: any[]) => {
      try {
          if (thisObj) {
              return await handler.apply(thisObj, params)
          } else return await handler(...params)
      } catch (e) {
          let err = unifyErrMesg(e, type, subType)
          if (proc.env.NODE_ENV && ['prod', 'production'].indexOf(proc.env.NODE_ENV.toLowerCase()) >=0) {
              err.error = msg
          } else if (msg && err) {
              if (typeof err.error === 'string') {
                  err.error = `${msg}: ${err.error}`
              } else if (!err.error) {
                  err.error = msg
              }
          }
          throw err
      }
  }
}

// 2019-05-08
export const debugLog = nodeUtil.debuglog('sardines')

// 2019-05-08
export const mergeObjects = (target: any, source: any): any => {
    if (typeof target !== 'object' || typeof source !== 'object') return null
    if (Array.isArray(source) && !Array.isArray(target)) return null
    if (Array.isArray(source)) {
        for (let i = 0; i < source.length; i++) {
            if (typeof source[i] !== 'object') {
                target[i] = source[i]
            } else {
                if (typeof target[i] !== 'object') {
                    target[i] = Array.isArray(source[i]) ? [] : {}
                }
                mergeObjects(target[i], source[i])
            }
        }
    } else {
        for (const k in source) {
            const v = source[k]
            if (typeof v !== 'object') target[k] = v
            else {
                if (typeof target[k] !== 'object') {
                    target[k] = Array.isArray(v) ? [] : {}
                }
                mergeObjects(target[k], v)
            }
        }
    }
    return target
}

// 2019-05-08
export const isEqual = (A: any, B: any, isReverse: boolean = false): boolean => {
    if (typeof A === 'undefined' || A === null || typeof B === 'undefined' || B === null) return A == B
    if (typeof A !== 'object' && typeof A !== 'function') return A == B
    if (typeof A === 'function' && typeof B === 'function') return A.toString() === B.toString()
    if ((Array.isArray(A) && !Array.isArray(B)) || (!Array.isArray(A) && Array.isArray(B))) return false
    if (Array.isArray(A) && Array.isArray(B)) {
        if (A.length !== B.length) return false
        for (let i = 0; i < A.length; i++) {
            if (!isEqual(A[i], B[i])) return false
        }
    } else {
        // both are objects
        for (const k in A) {
            if (!isEqual(A[k], B[k])) return false
        }
    }
    if (!isReverse) return isEqual(B, A, true)
    return true
}

// 2019-05-08
interface ChainedFunction {
    (fnParam: any, next: ChainedFunction|undefined): any
}
export const chainFunctions = (functionArray: ChainedFunction[], fnParam: any) => {
    if (Array.isArray(functionArray) && functionArray && functionArray.length > 0) {
        const midlist = functionArray.map(fn => (
            async (next?: ChainedFunction) => {
                await fn(fnParam, next)
            }
        ))
        midlist.push(() => Promise.resolve())
        return midlist.reduceRight((pre, cur) => (
            async () => {
                await cur(pre)
            }
        ))
    }
    return null
}

// 2019-05-09
export const inspect = (obj: any) => nodeUtil.inspect(obj, { depth: null, colors: false })
export const colorfulInspect = (obj: any) => nodeUtil.inspect(obj, { depth: null, colors: true })
export const inspectedLog = (obj: any) => console.log(colorfulInspect(obj))
export const inspectedDebugLog = (errMsg: string, obj: any) => debugLog(errMsg + ':\n' + colorfulInspect(obj))

// 2019-05-14
export const logo = 'sardines'

// 2019-06-13
export const parseArgs = () => {
    // Parse the arguments
    const params: { [key: string]: any } = {}
    const files: string[] = []
    for (let i = 2; i < proc.argv.length; i++) {
        const item = proc.argv[i];
        if (item[0] === '-') {
            // is an argument
            const keyAndValue = item.replace(/^-+/, '').split('=')
            if (keyAndValue.length === 1) {
                // boolean type argument
                params[keyAndValue[0]] = true
            } else if (keyAndValue.length === 2) {
                const key = keyAndValue[0]
                keyAndValue.shift()
                params[key] = (keyAndValue).join('=')
            }
        } else {
            // is a file path
            files.push(item)
        }
    }
    return {params, files}
}

// 2019-08-04
export const genServiceIdentitySting = (serviceIdentity: Sardines.ServiceIdentity):string => {
    if (serviceIdentity.version && serviceIdentity.version !== '*') {
        return `${serviceIdentity.application}:${serviceIdentity.module}:${serviceIdentity.name}:${serviceIdentity.version}`
    } else {
        return `${serviceIdentity.application}:${serviceIdentity.module}:${serviceIdentity.name}`
    }
}
  
export const parseServiceIdentity = (identityString: string):Sardines.ServiceIdentity|null => {
    if (!identityString) return null
    const parts = identityString.split(':')
    if (parts.length !== 3 && parts.length !== 4) return null
    return {
        application: parts[0],
        module: parts[1],
        name: parts[2],
        version: parts.length === 4 ? parts[3] : '*'
    }
}

// 2019-10-17
export const sleep = async(milliseconds: number) => {
    return new Promise((res) => {
        setTimeout(() => {
            res()
        }, milliseconds)
    })
}

export const getKey = (obj: any):string => {
    let key = ''
    if (obj && typeof obj === 'object') {
        Object.keys(obj).sort().map(prop => {
            if (!key) key = JSON.stringify(obj[prop])
            else key+=':'+JSON.stringify(obj[prop])
        })
    }
    return key
}

export const getDefaultClassFromPackage = (packClass: any) => {
    console.log('trying to get class from package:', packClass)
    if (typeof packClass === 'function') {
        return packClass
    } else if (typeof packClass === 'object' && packClass.Class && typeof packClass.Class === 'function') {
        return packClass.Class
    } else if (typeof packClass === 'object' && packClass.default && typeof packClass.default === 'function') {
        return packClass.default
    } else if (typeof packClass === 'object' ) {
        console.warn('[Sardines Core] the got an object which should be a class:', packClass, ', inspected:', inspect(packClass), ', name property:', packClass.name)
        console.warn('[Sardines Core] this may caused by a default export in the package of that class, but current runtime environment is using CommonJS which do not suport default export')
        console.warn('[Sardines Core] to fix this problem, please contact that package maintainer, to add a named export "Class" to export the class')
    }
    return null
}
