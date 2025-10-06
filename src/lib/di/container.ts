/**
 * Dependency Injection Container
 * 
 * Simple DI container for managing dependencies and improving testability
 */

export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T = any> = (...args: any[]) => T;
export type ServiceIdentifier<T = any> = string | Constructor<T> | symbol;

export interface ServiceDefinition<T = any> {
  identifier: ServiceIdentifier<T>;
  factory: Factory<T>;
  singleton: boolean;
  dependencies: ServiceIdentifier[];
  instance?: T;
}

export class DIContainer {
  private services = new Map<ServiceIdentifier, ServiceDefinition>();
  private instances = new Map<ServiceIdentifier, any>();

  /**
   * Register a service
   */
  register<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    options: {
      singleton?: boolean;
      dependencies?: ServiceIdentifier[];
    } = {}
  ): this {
    this.services.set(identifier, {
      identifier,
      factory,
      singleton: options.singleton ?? true,
      dependencies: options.dependencies ?? []
    });
    return this;
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    dependencies: ServiceIdentifier[] = []
  ): this {
    return this.register(identifier, factory, { singleton: true, dependencies });
  }

  /**
   * Register a transient service
   */
  registerTransient<T>(
    identifier: ServiceIdentifier<T>,
    factory: Factory<T>,
    dependencies: ServiceIdentifier[] = []
  ): this {
    return this.register(identifier, factory, { singleton: false, dependencies });
  }

  /**
   * Register an instance
   */
  registerInstance<T>(identifier: ServiceIdentifier<T>, instance: T): this {
    this.instances.set(identifier, instance);
    return this;
  }

  /**
   * Resolve a service
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    // Check if instance is already registered
    if (this.instances.has(identifier)) {
      return this.instances.get(identifier) as T;
    }

    const service = this.services.get(identifier);
    if (!service) {
      throw new Error(`Service not found: ${String(identifier)}`);
    }

    // Resolve dependencies
    const dependencies = service.dependencies.map(dep => this.resolve(dep));

    // Create instance
    const instance = service.factory(...dependencies);

    // Store instance if singleton
    if (service.singleton) {
      this.instances.set(identifier, instance);
    }

    return instance;
  }

  /**
   * Check if service is registered
   */
  isRegistered(identifier: ServiceIdentifier): boolean {
    return this.services.has(identifier) || this.instances.has(identifier);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }

  /**
   * Remove a service
   */
  remove(identifier: ServiceIdentifier): boolean {
    const serviceRemoved = this.services.delete(identifier);
    const instanceRemoved = this.instances.delete(identifier);
    return serviceRemoved || instanceRemoved;
  }

  /**
   * Get all registered service identifiers
   */
  getRegisteredServices(): ServiceIdentifier[] {
    return Array.from(this.services.keys());
  }

  /**
   * Create a child container
   */
  createChild(): DIContainer {
    const child = new DIContainer();
    
    // Copy services (but not instances)
    for (const [identifier, service] of this.services) {
      child.services.set(identifier, { ...service });
    }
    
    return child;
  }
}

// Global container instance
export const container = new DIContainer();
