/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-02 11:51:54
 * @modify date 2019-08-02 11:51:54
 * @desc [description]
 */

import * as npm from 'npm'
import { Sardines } from './sardines_interfaces'
import { unifyErrMesg } from './utils'

export namespace Source {
    let npmInst: any = null
    export const npmCmd = (command: string, args: string[]) => {
        return new Promise((resolve, reject) => {
            const cmd = () => {
                (<{[key: string]: any}>(npmInst.commands))[command](args, (err:any, data: any) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(data)
                    }
                })
            }
            if (!npmInst) {
                npm.load((err, inst) => {
                    if (err) reject(err)
                    else {
                        // console.log('npm load data:', data)
                        npmInst = inst
                        cmd()
                    }
                })
            } else {
                cmd()
            }
        })
    }
    
    export const getPackageFromNpm = async (packName: string, locationType: Sardines.LocationType, verbose: boolean = false ) =>  {
      try {
          const type = locationType || Sardines.LocationType.npm
          switch (type) {
          case Sardines.LocationType.npm:
              if (verbose) {
                  console.log('going to install package:', packName)
              }
              await npmCmd('install', [packName])
              if (verbose) {
                  console.log('package:', packName, 'installed')
              }
              break
          case Sardines.LocationType.npm_link:
              if (verbose) {
                  console.log('going to link package:', packName)
              }
              await npmCmd('link', [packName])
              if (verbose) {
                  console.log('package:', packName, 'linked')
              }
              break
          case Sardines.LocationType.file:
              break
          default:
              break
          }
          const packageInst:any = require(packName)
          if (packageInst) return packageInst.default
          else return null
      } catch (e) {
          if (verbose) {
              console.error(`ERROR when importing provider class [${packName}]`)
          }
          throw unifyErrMesg(`Error when importing npm package [${packName}]: ${e}`, 'deployer', 'npm')
      }
    }
}
