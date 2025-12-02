import browser, { Runtime } from 'webextension-polyfill';

import { deserializeError } from './helpers';
import { MessageType, RequestMessage } from './types';

export class IntercomClient {
  private port: Runtime.Port;
  private reqId: number;

  constructor() {
    this.port = this.buildPort();
    this.reqId = 0;
  }

  /**
   * Makes a request to background process and returns a response promise
   */
  async request(payload: any): Promise<any> {
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
    const listener = (msg: any) => {
      if (msg?.type === MessageType.Sub) {
        callback(msg.data);
      }
    };

    this.port.onMessage.addListener(listener);
    return () => this.port.onMessage.removeListener(listener);
  }

  private buildPort() {
    const port = browser.runtime.connect({ name: 'INTERCOM' });
    port.onDisconnect.addListener(() => {
      setTimeout(() => {
        this.port = this.buildPort();
      }, 1000);
    });

    return port;
  }

  private send(msg: RequestMessage) {
    this.port.postMessage(msg);
  }
}
