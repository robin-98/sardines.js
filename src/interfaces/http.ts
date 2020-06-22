/**
 * @author Robin Sun
 * @email robin@naturewake.com
 * @create date 2019-06-15 16:41:16
 * @modify date 2019-06-15 16:41:16
 * @desc [description]
 */

import { Sardines } from './sardines'

export namespace Http {
    export enum Protocol {
        HTTP = 'http',
        HTTPS = 'https',
        HTTP2 = 'http2',
        HTTP3 = 'http3'
    }

    export interface ServiceProviderPublicInfo {
        protocol?: Protocol
        host?: string
        root?: string
        port?: number
        [key: string]: any
    }

    export enum ServiceInputParamPosition {
        body = 'body',
        ctx = 'ctx',
        session = 'session',
        files = 'files',
        header = 'header',
        query = 'query',
        cookies = 'cookies',
    
    }
    
    export enum ServiceInputParamType {
        object = 'object',
        string = 'string',
        number = 'number',
        boolean = 'boolean'
    }
    
    export enum Method {
        GET = 'get',
        PUT = 'put',
        POST = 'post', 
        HEADER = 'header',
        OPTIONS = 'options',
        DEL = 'del',
        DELETE = 'delete'
    }
    
    export enum ServiceResponseType {
        static = 'static',
        file = 'file',
        html = 'html',
        render = 'render',
        handler = 'handler',
        json = 'json',
        text = 'text',
        string = 'string',
        number = 'number',
        boolean = 'boolean'
    }
    
    // Interfaces for the service settings 
    export interface ServiceResponse {
        type: ServiceResponseType
        path?: string|any[]
    }
    
    export interface ServiceInputParameter {
        position: ServiceInputParamPosition
        type?: ServiceInputParamType
        name?: string
    }
    
    export interface ServiceSettings {
        protocol?: Protocol
        path?: string
        method?: Method
        handler?: any
        inputParameters?: ServiceInputParameter[]
        response?: ServiceResponse
        middlewares?: any[]
        postProcesses?: any[]
        summary?: string
    }

    export namespace Transform {
        export const parseServicePath = (service: Sardines.ServiceIdentity):string => {
            return `/${service.application}/${service.module}/${service.name}`.replace(/\/\//g, '/')
        }
    }
}