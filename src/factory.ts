/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-04 19:30:12
 * @modify date 2019-08-04 19:30:12
 * @desc [description]
 */

import { isEqual, debugLog } from './utils'
import * as utils from './utils'

// 2019-05-08
interface FactoryInstance {
  settings: object
  CustomClass: any
  instance: object
}

export class Factory {

  static classes: Map<string, Map<string, any>> = new Map()
  static instances: Map<string, Array<FactoryInstance>> = new Map()
  static instFastCache: Map<string, Map<string, any>> = new Map()

  // Factory method
  static setClass(name: string, Class: any, type: string = 'unknown'): void {
      console.log('going to set class for:', type, name, ', class:', Class)
      if (typeof name !== 'string' || !name || !Class) return
      if (!this.classes.has(type)) this.classes.set(type, new Map())
      const category = this.classes.get(type)!
      category.set(name, Class)
      console.log('successfully set class for:', type, name, ', class:', Class)
  }

  static getClass(name: string, type: string = 'unknown'): any {
      if (!name) return null
      if (!this.classes.has(type)) return null
      const category = this.classes.get(type)!
      if (!category.has(name)) return null
      return category.get(name)
  }

  static getInstance(CustomClass: any, settings: object, type: string = 'unknown', fastKey: string = ''): any {
      if (!CustomClass) return null
      // Search by parameters
      let instance: any = null

      let memcache = this.instances.get(type)
      let fastcache = this.instFastCache.get(type)
      if (memcache && !fastKey) {
          for (let item of memcache) {
              if (isEqual(
                  { settings: item.settings, CustomClass: item.CustomClass },
                  { settings, CustomClass },
              )) {
                  instance = item.instance
                  if (instance) return instance
              }
          }
      } else if (fastKey && fastcache) {
          instance = fastcache.get(fastKey)
          if (instance) return instance
      }

      // Not found in memory
      if (typeof CustomClass === 'function') {
          console.log('custom class:', CustomClass)
          instance = new CustomClass(settings)
      } else if (typeof CustomClass === 'string' && CustomClass) {
          const Class = this.getClass(CustomClass, type)
          console.log('class:', Class, 'class name:', CustomClass)
          // Create the instance of a class
          if (Class && typeof Class === 'function') {
              instance = new Class(settings)
          } else if (typeof Class === 'object') {
              console.log('got object type class:', utils.inspect(Class))
              console.log('the object type class true type is:', Object.prototype.toString.call(Class))
              console.log('name of class:', Class.name)
              instance = new Class[Class.name](settings)
          }
      }
      if (instance) {
          if (!memcache) {
              memcache = new Array()
              this.instances.set(type, memcache)
          }
          memcache.push({ instance, settings, CustomClass })

          if (fastKey) {
              if (!fastcache) {
                  fastcache = new Map()
                  this.instFastCache.set(type, fastcache)
              }
              fastcache.set(fastKey, instance)
          }
      }
      console.log('instance:', instance)
      return instance
  }

  static async execMethodOnInstances(type: string|null|undefined, method: string, ...parameters: []) {
      if (!type) type = 'unknown'
      if (!this.instances.has(type)) return
      const memcache = this.instances.get(type)!
      try {
          for (let i = 0; i < memcache.length; i++) {
              const instStrcut = memcache[i]
              if (instStrcut 
                  && instStrcut.instance 
                  && typeof (<{[methodName: string]: any}>instStrcut.instance)[method] === 'function') {
                  await (<{[methodName: string]: any}>instStrcut.instance)[method](...parameters)
              }
          }
      } catch (e) {
          debugLog(`ERROR when implementing method ${method} on ${type === 'unknown'? "": type + " "}instances`)
      }
  }
}

