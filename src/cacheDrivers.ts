/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-08-02 17:18:19
 * @modify date 2019-08-02 17:18:19
 * @desc [description]
 */


import { Sardines } from './sardines_interfaces'
import { Source } from './sourcing'

export const cacheDrivers = async (sardinesConfig: Sardines.Config, writeline: any) => {
  if (sardinesConfig.drivers && sardinesConfig.drivers.length) {
    for (let driver of sardinesConfig.drivers) {
      if (driver.locationType === Sardines.LocationType.npm_link || driver.locationType === Sardines.LocationType.npm) {
        const driverClass = await Source.getPackageFromNpm(driver.name, driver.locationType)
        if (driverClass) {
          writeline(JSON.stringify(driverClass))
        }
      }
    }
  }
}