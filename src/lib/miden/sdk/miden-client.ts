import { MidenClientInterface, MidenClientCreateOptions } from './miden-client-interface';

/**
 * Singleton manager for MidenClientInterface.
 * Ensures only one instance of the client (and its underlying web worker) exists at a time.
 */
class MidenClientSingleton {
  private instance: MidenClientInterface | null = null;
  private initializingPromise: Promise<MidenClientInterface> | null = null;
  private currentOptions: MidenClientCreateOptions = {};

  /**
   * Get or create the singleton MidenClientInterface instance.
   * Recreates the client if options are specified and differ from the current options.
   */
  async getInstance(options: MidenClientCreateOptions = {}): Promise<MidenClientInterface> {
    if (this.instance && this.shouldRecreate(options)) {
      this.dispose();
    }

    if (this.instance) {
      return this.instance;
    }

    if (this.initializingPromise) {
      return this.initializingPromise;
    }

    this.currentOptions = options;
    this.initializingPromise = (async () => {
      const client = await MidenClientInterface.create(options);
      this.instance = client;
      this.initializingPromise = null;
      return client;
    })();

    return this.initializingPromise;
  }

  private shouldRecreate(newOptions: MidenClientCreateOptions): boolean {
    const oldSeed = this.currentOptions.seed?.toString();
    const newSeed = newOptions.seed?.toString();
    if (oldSeed !== newSeed) {
      return true;
    }

    // Recreate client if onConnectivityIssue callback is present or has been unset
    const hasCallback = typeof newOptions.onConnectivityIssue === 'function';
    if (hasCallback) {
      return true;
    }

    const hadCallback = typeof this.currentOptions.onConnectivityIssue === 'function';
    if (hadCallback && !hasCallback) {
      return true;
    }

    return false;
  }

  dispose(): void {
    if (this.instance) {
      this.instance.free();
      this.instance = null;
      this.initializingPromise = null;
    }
  }
}

// Export a single instance of the singleton manager
export const midenClientSingleton = new MidenClientSingleton();

/**
 * Convenience function to get the shared MidenClientInterface instance.
 * Use this in your components and modules instead of calling MidenClientInterface.create().
 */
export async function getMidenClient(options?: MidenClientCreateOptions): Promise<MidenClientInterface> {
  return midenClientSingleton.getInstance(options);
}

/**
 * Dispose the shared client instance.
 */
export function disposeMidenClient(): void {
  midenClientSingleton.dispose();
}
