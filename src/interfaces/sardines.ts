/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-06-15 16:41:11
 * @modify date 2019-06-15 16:41:11
 * @desc [description]
 */
export namespace Sardines {
    export interface ServiceArgument {
        name: string
        type: string
    }

    export interface Service {
        name: string
        module: string
        arguments: ServiceArgument[]
        returnType: string
        isAsync?: boolean
        filepath?: string
    }
    
    export interface ServiceIdentity {
        application: string
        module: string
        name: string
        version?: string
    }

    export interface Entry {
        providerInfo: ProviderPublicInfo 
        user?: string
        password?: string
        token?: string
    }

    export interface Module {
        [serviceName:string]: string
    }
    
    export interface Application {
        [moduleName: string]: Module
    }
    
    export interface DriverSettings {
        name: string
        locationType: LocationType
        protocols: string[]
    }

    export enum Platform {
        nodejs = 'nodejs',
        browser = 'browser',
        reactNative = 'reactNative'
    }

    export interface Config {
        application: string
        platform: Platform
        exeDir?: string
        srcRootDir?: string 
        sardinesDir?: string 
        remoteServices?: {
            [appName: string]: Application
        }
        repositoryEntries: Entry[]
        drivers?: DriverSettings[]
    }

    export enum LocationType {
        npm_link = 'npm_link',
        npm = 'npm',
        file = 'file'
      }
      
    export interface LocationSettings {
        name?: string
        locationType: LocationType
        location?: string
    }

    export interface ServiceSettingsForProvider {
        module: string
        name: string
        settings: any
    }
    
    export interface ApplicationSettingsForProvider {
        application: string
        commonSettings: any
        serviceSettings: ServiceSettingsForProvider[]
    }

    export interface DriversForProvider {
        [platform: string]: string
    }

    export interface ProviderPublicInfo {
        protocol: string
        driver: string|DriversForProvider
        [key: string]: any
    }

    export interface ProviderSettings {
        protocol: string
        public: ProviderPublicInfo
        [key: string]: any
    }
    
    export interface ProviderDefinition {
        code: LocationSettings
        providerSettings: ProviderSettings
        applicationSettings: ApplicationSettingsForProvider[]
    }
    
    export interface ServiceArgument {
        name: string
        type: string
    }
    
    export interface ApplicationSettings {
        name: string
        code: LocationSettings
        version: string
        init: {
            service: string
            arguments: any[]
        }[]
    }
    
    export interface DeployPlan {
        providers: ProviderDefinition[]
        applications: ApplicationSettings[]
    }

    // Runtime interfaces
    export namespace Runtime {
        export enum ServiceEntryType {
            dedicated = 'dedicated',
            proxy = 'proxy'
        }
    
        export interface ServiceEntry {
            type: ServiceEntryType
            providerName: string
            providerInfo?: any
            serviceSettings?: any
        }
    
        export interface Service {
            identity: ServiceIdentity
            arguments: ServiceArgument[]
            returnType: string
            entries: ServiceEntry[]
            expireInSeconds?: number
        }
    
        export interface DeployResult {
            [applicationName: string]: Service[]
        }
    }
}