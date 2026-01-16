import { isMobile } from 'lib/platform';

import { deserializeError } from './helpers';
import { getMobileIntercomAdapter } from './mobile-adapter';
import { MessageType, RequestMessage } from './types';

/**
 * Interface for intercom clients (both extension and mobile)
 */
export interface IIntercomClient {
  request(payload: any): Promise<any>;
  subscribe(callback: (data: any) => void): () => void;
}

// Lazy-loaded browser polyfill (only loaded in extension context)
let browserPolyfill: typeof import('webextension-polyfill') | null = null;
async function getBrowser() {
  if (!browserPolyfill) {
    browserPolyfill = await import('webextension-polyfill');
  }
  return browserPolyfill.default;
}

/**
 * Creates the appropriate intercom client based on the platform
 */
export function createIntercomClient(): IIntercomClient {
  if (isMobile()) {
    return getMobileIntercomAdapter();
  }
  return new IntercomClient();
}

export class IntercomClient implements IIntercomClient {
  private port: any; // Runtime.Port - typed as any to avoid import
  private reqId: number;
  private portReady: Promise<void>;

  constructor() {
    this.reqId = 0;
    this.portReady = this.initPort();
  }

  private async initPort() {
    const browser = await getBrowser();
    this.port = this.buildPort(browser);
  }

  /**
   * Makes a request to background process and returns a response promise
   */
  async request(payload: any): Promise<any> {
    await this.portReady;
    const reqId = this.reqId++;

    this.send({ type: MessageType.Req, data: payload, reqId });

    return new Promise((resolve, reject) => {
      const listener = (msg: any) => {
        switch (true) {
          case msg?.reqId !== reqId:
            return;

          case msg?.type === MessageType.Res:
            resolve(msg.data);
            break;

          case msg?.type === MessageType.Err:
            reject(deserializeError(msg.data));
            break;
        }

        this.port.onMessage.removeListener(listener);
      };

      this.port.onMessage.addListener(listener);
    });
  }

  /**
   * Allows to subscribe to notifications channel from background process
   */
  subscribe(callback: (data: any) => void) {
    // Note: This is sync but port might not be ready yet
    // In practice, this is called after the app is loaded
    const listener = (msg: any) => {
      if (msg?.type === MessageType.Sub) {
        callback(msg.data);
      }
    };

    // Wait for port to be ready before subscribing
    this.portReady.then(() => {
      this.port.onMessage.addListener(listener);
    });

    return () => {
      if (this.port) {
        this.port.onMessage.removeListener(listener);
      }
    };
  }

  private buildPort(browser: any) {
    const port = browser.runtime.connect({ name: 'INTERCOM' });
    port.onDisconnect.addListener(() => {
      setTimeout(async () => {
        const browser = await getBrowser();
        this.port = this.buildPort(browser);
      }, 1000);
    });

    return port;
  }

  private send(msg: RequestMessage) {
    this.port.postMessage(msg);
  }
}
