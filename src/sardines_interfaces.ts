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
        isAsync: boolean
        filepath: string
    }
    
    export interface ServiceIdentity {
        application: string
        module: string
        name: string
        version?: string
    }

    export interface RepositoryEntryAddress {
        type: string
        providerInfo: any
    }
    
    export interface RepositoryEntry {
        address: RepositoryEntryAddress 
        user: string
        password: string
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

    export interface Config {
        application: string
        exeDir?: string
        srcRootDir?: string 
        sardinesDir?: string 
        remoteServices?: {
            [appName: string]: Application
        }
        repositoryEntries: RepositoryEntry[]
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
    
    export interface ProviderSettings {
        code: LocationSettings
        providerSettings: any
        applicationSettings: ApplicationSettingsForProvider[]
    }
    
    export interface ServiceArgument {
        name: string
        type: string
    }
    
    export interface ApplicationSettings {
        name: string
        code: LocationSettings
        init: {
            service: string
            arguments: any[]
        }[]
    }
    
    export interface DeployPlan {
        providers: ProviderSettings[]
        applications: ApplicationSettings[]
    }

    export enum ServiceRuntimeEntryType {
        dedicated = 'dedicated',
        proxy = 'proxy'
    }

    export interface ServiceRuntimeEntry {
        type: ServiceRuntimeEntryType
        providerName: string
        providerInfo: any
    }

    export interface ServiceRuntime {
        identity: ServiceIdentity
        arguments: ServiceArgument[]
        returnType: string
        entries: ServiceRuntimeEntry[]
        expireInSeconds: number
    }
}