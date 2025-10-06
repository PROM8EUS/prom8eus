/**
 * Injectable Decorator and Utilities
 * 
 * Decorators and utilities for dependency injection
 */

import { container } from './container';
import { DI_TOKENS } from './tokens';

/**
 * Injectable decorator for classes
 */
export function Injectable<T extends new (...args: any[]) => any>(
  token?: symbol,
  options: {
    singleton?: boolean;
    dependencies?: symbol[];
  } = {}
) {
  return function (target: T) {
    const serviceToken = token || Symbol(target.name);
    
    // Register the service in the container
    container.register(
      serviceToken,
      (...deps: any[]) => new target(...deps),
      {
        singleton: options.singleton ?? true,
        dependencies: options.dependencies ?? []
      }
    );
    
    // Add metadata to the class
    Reflect.defineMetadata('di:token', serviceToken, target);
    Reflect.defineMetadata('di:dependencies', options.dependencies ?? [], target);
    Reflect.defineMetadata('di:singleton', options.singleton ?? true, target);
    
    return target;
  };
}

/**
 * Inject decorator for constructor parameters
 */
export function Inject(token: symbol) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingTokens = Reflect.getMetadata('di:inject', target) || [];
    existingTokens[parameterIndex] = token;
    Reflect.defineMetadata('di:inject', existingTokens, target);
  };
}

/**
 * Service decorator for methods
 */
export function Service(token?: symbol) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const serviceToken = token || Symbol(`${target.constructor.name}.${propertyKey}`);
    
    // Register the service method
    container.register(
      serviceToken,
      () => descriptor.value.bind(target),
      { singleton: true }
    );
    
    return descriptor;
  };
}

/**
 * Factory decorator for factory functions
 */
export function Factory(token: symbol, dependencies: symbol[] = []) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    container.register(
      token,
      (...deps: any[]) => descriptor.value(...deps),
      { singleton: false, dependencies }
    );
    
    return descriptor;
  };
}

/**
 * Get service from container
 */
export function getService<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/**
 * Check if service is registered
 */
export function isServiceRegistered(token: symbol): boolean {
  return container.isRegistered(token);
}

/**
 * Create service instance with dependencies
 */
export function createService<T>(token: symbol): T {
  return container.resolve<T>(token);
}

/**
 * Service locator pattern
 */
export class ServiceLocator {
  private static container = container;
  
  static get<T>(token: symbol): T {
    return this.container.resolve<T>(token);
  }
  
  static register<T>(token: symbol, factory: (...args: any[]) => T, options?: {
    singleton?: boolean;
    dependencies?: symbol[];
  }): void {
    this.container.register(token, factory, options);
  }
  
  static registerInstance<T>(token: symbol, instance: T): void {
    this.container.registerInstance(token, instance);
  }
  
  static isRegistered(token: symbol): boolean {
    return this.container.isRegistered(token);
  }
  
  static clear(): void {
    this.container.clear();
  }
}

/**
 * Service provider interface
 */
export interface ServiceProvider<T = any> {
  provide(): T;
}

/**
 * Abstract service provider
 */
export abstract class AbstractServiceProvider<T = any> implements ServiceProvider<T> {
  abstract provide(): T;
}

/**
 * Service provider decorator
 */
export function ServiceProvider(token: symbol) {
  return function <T extends new (...args: any[]) => AbstractServiceProvider>(target: T) {
    container.register(
      token,
      (...deps: any[]) => {
        const instance = new target(...deps);
        return instance.provide();
      },
      { singleton: true }
    );
    
    return target;
  };
}

/**
 * Service factory interface
 */
export interface ServiceFactory<T = any> {
  create(...args: any[]): T;
}

/**
 * Abstract service factory
 */
export abstract class AbstractServiceFactory<T = any> implements ServiceFactory<T> {
  abstract create(...args: any[]): T;
}

/**
 * Service factory decorator
 */
export function ServiceFactory(token: symbol, dependencies: symbol[] = []) {
  return function <T extends new (...args: any[]) => AbstractServiceFactory>(target: T) {
    container.register(
      token,
      (...deps: any[]) => {
        const instance = new target(...deps);
        return instance.create.bind(instance);
      },
      { singleton: true, dependencies }
    );
    
    return target;
  };
}

/**
 * Service configuration interface
 */
export interface ServiceConfiguration {
  token: symbol;
  factory: (...args: any[]) => any;
  singleton: boolean;
  dependencies: symbol[];
}

/**
 * Service configuration builder
 */
export class ServiceConfigurationBuilder {
  private config: Partial<ServiceConfiguration> = {};
  
  token(token: symbol): this {
    this.config.token = token;
    return this;
  }
  
  factory(factory: (...args: any[]) => any): this {
    this.config.factory = factory;
    return this;
  }
  
  singleton(singleton: boolean = true): this {
    this.config.singleton = singleton;
    return this;
  }
  
  dependencies(dependencies: symbol[]): this {
    this.config.dependencies = dependencies;
    return this;
  }
  
  build(): ServiceConfiguration {
    if (!this.config.token || !this.config.factory) {
      throw new Error('Token and factory are required');
    }
    
    return {
      token: this.config.token,
      factory: this.config.factory,
      singleton: this.config.singleton ?? true,
      dependencies: this.config.dependencies ?? []
    };
  }
  
  register(): void {
    const config = this.build();
    container.register(
      config.token,
      config.factory,
      {
        singleton: config.singleton,
        dependencies: config.dependencies
      }
    );
  }
}

/**
 * Create service configuration builder
 */
export function configureService(): ServiceConfigurationBuilder {
  return new ServiceConfigurationBuilder();
}
