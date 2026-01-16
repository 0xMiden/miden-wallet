import { isMobile } from 'lib/platform';

// Lazy-loaded IntercomServer (only in extension context)
let _intercom: import('lib/intercom/server').IntercomServer | null = null;

export function getIntercom() {
  if (isMobile()) {
    throw new Error('IntercomServer is not available on mobile');
  }
  if (!_intercom) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { IntercomServer } = require('lib/intercom/server');
    _intercom = new IntercomServer();
  }
  return _intercom;
}

// For backward compatibility - lazy getter
export const intercom = {
  get instance() {
    return getIntercom();
  },
  onRequest: (...args: Parameters<import('lib/intercom/server').IntercomServer['onRequest']>) => {
    return getIntercom().onRequest(...args);
  },
  broadcast: (...args: Parameters<import('lib/intercom/server').IntercomServer['broadcast']>) => {
    return getIntercom().broadcast(...args);
  }
};

export class PublicError extends Error {}
