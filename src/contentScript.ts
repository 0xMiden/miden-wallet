import browser from 'webextension-polyfill';

import { IntercomClient } from 'lib/intercom/client';
import { serealizeError } from 'lib/intercom/helpers';

enum BeaconMessageTarget {
  Page = 'toPage',
  Extension = 'toExtension'
}

type BeaconMessage =
  | {
      target: BeaconMessageTarget;
      payload: any;
    }
  | {
      target: BeaconMessageTarget;
      encryptedPayload: any;
    };
type BeaconPageMessage = BeaconMessage | { message: BeaconMessage; sender: { id: string } };

async function testIntercomConnection() {
  try {
    await getIntercom().request({
      type: 'PING',
      payload: 'PING'
    });
  } catch (err: any) {
    console.debug('Intercom connection corrupted', err);
    throw err;
  }
}

let script = document.createElement('script');
script.src = browser.runtime.getURL('addToWindow.js');
(document.head || document.documentElement).appendChild(script);

function keepSWAlive() {
  setTimeout(async function () {
    try {
      await browser.runtime.sendMessage('wakeup');
      await testIntercomConnection();
    } catch (e) {
      console.debug('Intercom connection corrupted', e);
    }
    keepSWAlive();
  }, 10_000);
}

const manifest = browser.runtime.getManifest();
if (manifest.manifest_version === 3) {
  keepSWAlive();
}

window.addEventListener(
  'message',
  evt => {
    if (evt.source !== window) return;

    const isAleoRequest = evt.data?.type === 'AleoPageMessageType.Request';

    if (isAleoRequest) {
      aleoRequest(evt);
    } else {
      return;
    }
  },
  false
);

function aleoRequest(evt: MessageEvent) {
  const { payload, reqId } = evt.data;

  // getIntercom()
  //   .request({
  //     type: AleoMessageType.PageRequest,
  //     origin: evt.origin,
  //     payload
  //   })
  //   .then((res: AleoResponse) => {
  //     if (res?.type === AleoMessageType.PageResponse) {
  //       send(
  //         {
  //           type: AleoPageMessageType.Response,
  //           payload: res.payload,
  //           reqId
  //         },
  //         evt.origin
  //       );
  //     }
  //   })
  //   .catch(err => {
  //     send(
  //       {
  //         type: AleoPageMessageType.ErrorResponse,
  //         payload: serealizeError(err),
  //         reqId
  //       },
  //       evt.origin
  //     );
  //   });
}

// function send(msg: AleoPageMessage | BeaconPageMessage, targetOrigin: string) {
//   if (!targetOrigin || targetOrigin === '*') return;
//   window.postMessage(msg, targetOrigin);
// }

let intercom: IntercomClient | null;
function getIntercom() {
  if (!intercom) {
    intercom = new IntercomClient();
  }
  return intercom;
}
