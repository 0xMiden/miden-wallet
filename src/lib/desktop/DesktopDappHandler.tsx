/**
 * DesktopDappHandler - Handles wallet requests from dApp browser window
 *
 * This component should be mounted in the main wallet app to listen for
 * and process wallet requests from dApps opened in the desktop browser.
 */

import { useEffect, useRef, useMemo } from 'react';

import { PrivateDataPermission } from '@demox-labs/miden-wallet-adapter-base';

import { dappConfirmationStore, DAppConfirmationRequest } from 'lib/dapp-browser/confirmation-store';
import { handleWebViewMessage, WebViewMessage } from 'lib/dapp-browser/message-handler';
import { isDesktop } from 'lib/platform';
import { useWalletStore } from 'lib/store';

import { onDappWalletRequest, sendDappWalletResponse, DappWalletRequest } from './dapp-browser';

/**
 * Hook that handles dApp wallet requests on desktop
 *
 * This sets up a listener for wallet requests from the dApp browser window
 * and processes them using the existing message handler infrastructure.
 */
export function useDesktopDappHandler(): void {
  const currentAccount = useWalletStore(s => s.currentAccount);
  const accounts = useWalletStore(s => s.accounts);
  const pendingConfirmationRef = useRef<DAppConfirmationRequest | null>(null);

  const accountId = useMemo(() => {
    if (currentAccount?.publicKey) return currentAccount.publicKey;
    if (accounts && accounts.length > 0) return accounts[0].publicKey;
    return null;
  }, [currentAccount, accounts]);

  const accountIdRef = useRef(accountId);
  useEffect(() => {
    accountIdRef.current = accountId;
  }, [accountId]);

  useEffect(() => {
    // Only run on desktop
    if (!isDesktop()) return;

    let unsubscribe: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unsubscribe = await onDappWalletRequest(async (request: DappWalletRequest, origin: string) => {
          console.log('[DesktopDappHandler] Received request:', request.type, 'reqId:', request.reqId);

          try {
            // Convert to WebViewMessage format used by existing handler
            const webViewMessage: WebViewMessage = {
              type: request.type,
              payload: request.payload,
              reqId: request.reqId
            };

            // Handle the message using existing infrastructure
            const response = await handleWebViewMessage(webViewMessage, origin);

            console.log('[DesktopDappHandler] Sending response for reqId:', request.reqId);

            // Send response back to dApp window
            await sendDappWalletResponse(response);
          } catch (error) {
            console.error('[DesktopDappHandler] Error handling request:', error);

            // Send error response
            const errorResponse = {
              type: 'MIDEN_PAGE_ERROR_RESPONSE',
              reqId: request.reqId,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            await sendDappWalletResponse(errorResponse);
          }
        });

        console.log('[DesktopDappHandler] Listening for dApp wallet requests');
      } catch (error) {
        console.error('[DesktopDappHandler] Failed to setup listener:', error);
      }
    };

    setupListener();

    // Subscribe to confirmation store for desktop confirmations
    const confirmationUnsubscribe = dappConfirmationStore.subscribe(() => {
      const request = dappConfirmationStore.getPendingRequest();
      if (request) {
        console.log('[DesktopDappHandler] Confirmation requested:', request.type);
        pendingConfirmationRef.current = request;

        // For desktop, we'll auto-approve for now (TODO: show confirmation modal)
        // In a production implementation, this would show a modal in the main window
        setTimeout(() => {
          if (pendingConfirmationRef.current?.id === request.id) {
            console.log('[DesktopDappHandler] Auto-approving confirmation for development');
            dappConfirmationStore.resolveConfirmation({
              confirmed: true,
              accountPublicKey: accountIdRef.current || undefined,
              privateDataPermission: request.privateDataPermission || PrivateDataPermission.UponRequest
            });
            pendingConfirmationRef.current = null;
          }
        }, 100);
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      confirmationUnsubscribe();
    };
  }, []);
}

/**
 * Component wrapper for the desktop dApp handler hook
 *
 * Mount this component in your app to enable desktop dApp browser functionality.
 */
export function DesktopDappHandler(): null {
  useDesktopDappHandler();
  return null;
}

export default DesktopDappHandler;
