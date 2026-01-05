import '../../../../test/jest-mocks';

import React, { Suspense, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { start } from 'lib/miden/back/main';
import { MidenContextProvider, useMidenContext } from 'lib/miden/front/client';
import { ensureWalletReady } from '../../../../test/state-helpers';

describe('useMidenContext signTransaction', () => {
  beforeAll(async () => {
    await start();
    await ensureWalletReady();
  });

  it('returns Uint8Array signature bytes from hex string', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    const result = new Promise<Uint8Array>(async resolve => {
      const Probe: React.FC = () => {
        const { ready, signTransaction } = useMidenContext();

        useEffect(() => {
          if (!ready) return;
          signTransaction('miden-account-1', 'payload').then(sig => resolve(sig));
        }, [ready, signTransaction]);

        return null;
      };

      await act(async () => {
        root.render(
          <Suspense fallback={null}>
            <MidenContextProvider>
              <Probe />
            </MidenContextProvider>
          </Suspense>
        );
      });
    });

    const sigBytes = await result;
    expect(sigBytes).toEqual(Uint8Array.from([0xab, 0xcd]));

    act(() => {
      root.unmount();
    });
  });
});
