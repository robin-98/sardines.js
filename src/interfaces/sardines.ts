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
        application?: string
        name: string
        module: string
        arguments: ServiceArgument[]
        returnType: string
        isAsync?: boolean
        filepath?: string
    }

    export interface ServiceDescriptionFile {
        services: Service[]
        application: string
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

    // sardines-config.json file
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
        file = 'file',
        git = 'git'
      }
      
    export interface LocationSettings {
        name?: string
        locationType: LocationType
        location?: string
        url?: string
    }

    export interface ServiceSettingsForProvider {
        module: string
        name: string
        settings: any
    }
    
    export interface ApplicationSettingsForProvider {
        protocol?: string
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
        name: string
        code: LocationSettings
        providerSettings: ProviderSettings
        applicationSettings?: ApplicationSettingsForProvider[]
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
            service: {
                module: string
                name: string
            }
            arguments: any[]
        }[]
    }
    
    // Deploy plan file for some services
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
            providerName?: string
            providerInfo?: any
            settingsForProvider?: any
        }
    
        export interface Service {
            identity: ServiceIdentity
            entries: ServiceEntry[]
            arguments?: ServiceArgument[]
            returnType?: string
            expireInSeconds?: number
            resourceId?: string
        }
    
        export interface DeployResult {
            [applicationName: string]: Service[]
        }

        // Runtime Resource
        export enum LoadBalancingStrategy {
            workloadFocusing = 'workloadFocusing',
            evenWorkload = 'evenWorkload',
            random = 'random'
        }

        export enum RuntimeStatus {
            ready = 'ready',
            pending = 'pending',
            deploying = 'deploying'
        }
        
        export enum RuntimeTargetType {
            service = 'service',
            host = 'host',
        }

        export enum ResourceType {
            host = 'host'
        }
        
        export interface Resource {
            name: string
            account: string
            tags?: string[]
            type?: ResourceType
            status?: RuntimeStatus
            workload_percentage?: number
            address?: {
              ipv4?: string
              ssh_port?: number
              ipv6?: string
            }
            cpu_cores?: number
            mem_megabytes?: number
            providers?: Sardines.ProviderDefinition[]
        }

        export interface ServiceCache {
            [appName: string]: {
              [moduleName: string]: {
                [serviceName: string]: any
              }
            }
        }
    }

    // Transform between data structures
    export namespace Transform {
        export const fromServiceToEmptyRuntime = (service: Service): Runtime.Service|null => {
            if (!service.application) return null
            return {
                identity: {
                    application: service.application!,
                    module: service.module,
                    name: service.name
                },
                arguments: service.arguments,
                returnType: service.returnType,
                entries: []
            }
        }

        export const fromServiceDescriptionFileToServiceCache = (descfile: ServiceDescriptionFile): Runtime.ServiceCache|null => {
            if (!descfile || !descfile.application || !descfile.services || !descfile.services.length) return null
            const cache :Runtime.ServiceCache = {}
            cache[descfile.application] = {}
            for (let service of descfile.services) {
                if (!service.module || !service.name) continue
                if (!cache[descfile.application][service.module]) cache[descfile.application][service.module] = {}
                cache[descfile.application][service.module][service.name] = service
            }
            return cache
        } 
    }
}