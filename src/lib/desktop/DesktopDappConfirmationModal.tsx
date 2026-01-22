/**
 * Desktop dApp Confirmation Modal
 *
 * Shows a modal in the main wallet window when a dApp requests
 * connection or transaction approval. This is more secure than
 * showing the confirmation in the dApp window itself.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { PrivateDataPermission } from '@demox-labs/miden-wallet-adapter-base';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import {
  dappConfirmationStore,
  DAppConfirmationRequest,
  DAppConfirmationResult
} from 'lib/dapp-browser/confirmation-store';
import { isDesktop } from 'lib/platform';
import { useWalletStore } from 'lib/store';

/**
 * Desktop confirmation modal component
 *
 * Listens for dApp confirmation requests and shows a modal for user approval.
 */
export function DesktopDappConfirmationModal(): React.ReactElement | null {
  const { t } = useTranslation();
  const [pendingRequest, setPendingRequest] = useState<DAppConfirmationRequest | null>(null);

  // Get account info
  const currentAccount = useWalletStore(s => s.currentAccount);
  const accounts = useWalletStore(s => s.accounts);

  const accountId = useMemo(() => {
    if (currentAccount?.publicKey) return currentAccount.publicKey;
    if (accounts && accounts.length > 0) return accounts[0].publicKey;
    return null;
  }, [currentAccount, accounts]);

  const shortAccountId = useMemo(() => {
    if (!accountId) return '';
    return `${accountId.slice(0, 10)}...${accountId.slice(-8)}`;
  }, [accountId]);

  // Subscribe to confirmation store
  useEffect(() => {
    if (!isDesktop()) return;

    const unsubscribe = dappConfirmationStore.subscribe(() => {
      const request = dappConfirmationStore.getPendingRequest();
      setPendingRequest(request);
    });

    // Check for any existing pending request
    setPendingRequest(dappConfirmationStore.getPendingRequest());

    return unsubscribe;
  }, []);

  const handleApprove = () => {
    if (!pendingRequest) return;

    const result: DAppConfirmationResult = {
      confirmed: true,
      accountPublicKey: accountId || undefined,
      privateDataPermission: pendingRequest.privateDataPermission || PrivateDataPermission.UponRequest
    };

    dappConfirmationStore.resolveConfirmation(result);
  };

  const handleDeny = () => {
    const result: DAppConfirmationResult = {
      confirmed: false
    };

    dappConfirmationStore.resolveConfirmation(result);
  };

  // Don't render if no pending request or not on desktop
  if (!pendingRequest || !isDesktop()) {
    return null;
  }

  const appName = pendingRequest.appMeta?.name || pendingRequest.origin;
  const isTransaction = pendingRequest.type === 'transaction' || pendingRequest.type === 'consume';
  const isSign = pendingRequest.type === 'sign';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-grey-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
            <Icon name={IconName.Globe} className="text-primary-500" size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-grey-900 truncate">{appName}</h2>
            <p className="text-sm text-grey-500 truncate">{pendingRequest.origin}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-grey-600 mb-4">
            {isTransaction ? t('dappTransactionRequest') : isSign ? t('dappSignRequest') : t('dappConnectionRequest')}
          </p>

          {/* Transaction messages */}
          {isTransaction && pendingRequest.transactionMessages && pendingRequest.transactionMessages.length > 0 && (
            <div className="bg-grey-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-grey-500 mb-2">{t('transactionDetails')}</p>
              {pendingRequest.transactionMessages.map((msg, index) => (
                <div key={index} className="text-sm text-grey-700 py-1 border-b border-grey-200 last:border-0">
                  {msg}
                </div>
              ))}
            </div>
          )}

          {/* Account info for connect requests */}
          {!isTransaction && (
            <div className="bg-grey-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-grey-500 mb-1">{t('account')}</p>
              <p className="text-sm font-mono text-grey-900">{shortAccountId || t('noAccountSelected')}</p>
            </div>
          )}

          {/* Network info */}
          <div className="bg-grey-50 rounded-xl p-4">
            <p className="text-xs text-grey-500 mb-1">{t('network')}</p>
            <p className="text-sm text-grey-900 capitalize">{pendingRequest.network}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-grey-100 flex gap-3">
          <button
            onClick={handleDeny}
            className="flex-1 py-3 px-6 rounded-full border-2 border-orange-500 text-orange-500 font-semibold hover:bg-orange-50 transition-colors"
          >
            {t('deny')}
          </button>
          <button
            onClick={handleApprove}
            disabled={!accountId && !isTransaction}
            className="flex-1 py-3 px-6 rounded-full bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:bg-grey-200 disabled:text-grey-400 disabled:cursor-not-allowed"
          >
            {isTransaction ? t('confirm') : t('approve')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DesktopDappConfirmationModal;
