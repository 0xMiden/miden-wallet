import React, { ComponentProps, FC, Suspense } from 'react';

// Lock-up checks are extension-only - skip on mobile

import AwaitFonts from 'app/a11y/AwaitFonts';
import AwaitI18N from 'app/a11y/AwaitI18N';
import BootAnimation from 'app/a11y/BootAnimation';
import DisableOutlinesForClick from 'app/a11y/DisableOutlinesForClick';
import RootSuspenseFallback from 'app/a11y/RootSuspenseFallback';
import { AppEnvProvider } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import Dialogs from 'app/layouts/Dialogs';
import PageRouter from 'app/PageRouter';
import { ExtensionMessageListener } from 'components/ConnectivityIssueBanner';
import { TransactionProgressModal } from 'components/TransactionProgressModal';
import { MidenProvider } from 'lib/miden/front';
import { isMobile as checkIsMobile, isMobile } from 'lib/platform';
import { PropsWithChildren } from 'lib/props-with-children';
import { DialogsProvider } from 'lib/ui/dialog';
import * as Woozie from 'lib/woozie';
import '../i18n';

import ConfirmPage from './ConfirmPage';
if (!isMobile()) {
  import('lib/lock-up/run-checks');
}

interface AppProps extends Partial<PropsWithChildren> {
  env: ComponentProps<typeof AppEnvProvider>;
}

const App: FC<AppProps> = ({ env }) => {
  return (
    <ErrorBoundary whileMessage="booting a wallet" className="min-h-screen" windowType={env.windowType}>
      <DialogsProvider>
        <Suspense fallback={<RootSuspenseFallback />}>
          <AppProvider env={env}>
            <Dialogs />

            <DisableOutlinesForClick />

            <AwaitI18N />

            <AwaitFonts name="Inter" weights={[300, 400, 500, 600]} className="antialiased font-inter">
              <BootAnimation>{env.confirmWindow ? <ConfirmPage /> : <PageRouter />}</BootAnimation>
            </AwaitFonts>
          </AppProvider>
        </Suspense>
      </DialogsProvider>
    </ErrorBoundary>
  );
};

export default App;

const AppProvider: FC<AppProps> = ({ children, env }) => {
  console.log('[AppProvider] Rendering, isMobile:', checkIsMobile());
  return (
    <AppEnvProvider {...env}>
      <Woozie.Provider>
        <ExtensionMessageListener />
        <MidenProvider>
          {children}
          {/* Always render on mobile for debugging */}
          <TransactionProgressModal />
        </MidenProvider>
      </Woozie.Provider>
    </AppEnvProvider>
  );
};
