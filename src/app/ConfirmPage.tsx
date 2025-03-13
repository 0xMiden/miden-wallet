/* eslint-disable no-restricted-globals */

import React, { FC, Suspense, useCallback, useMemo, useState } from 'react';

import { DecryptPermission } from '@demox-labs/miden-wallet-adapter-base';
import classNames from 'clsx';

import Spinner from 'app/atoms/Spinner/Spinner';
import ErrorBoundary from 'app/ErrorBoundary';
import ContentContainer from 'app/layouts/ContentContainer';
import Unlock from 'app/pages/Unlock';
import { Button, ButtonVariant } from 'components/Button';
import { CustomRpsContext } from 'lib/analytics';
import { T, t } from 'lib/i18n/react';
import { useAccount, useMidenContext } from 'lib/miden/front';
import { MidenDAppPayload } from 'lib/miden/types';
import { useRetryableSWR } from 'lib/swr';
import useSafeState from 'lib/ui/useSafeState';
import { useLocation } from 'lib/woozie';

import Alert from './atoms/Alert';
import FormSubmitButton from './atoms/FormSubmitButton';
import Name from './atoms/Name';
import { ConfirmPageSelectors } from './ConfirmPage.selectors';
import { openLoadingFullPage } from './env';
import AccountBanner from './templates/AccountBanner';
import ConnectBanner from './templates/ConnectBanner';
import DAppLogo from './templates/DAppLogo';
import DecryptPermissionBanner from './templates/DecryptPermissionBanner';
import DecryptPermissionCheckbox from './templates/DecryptPermissionCheckbox';
import { isDelegateProofEnabled } from './templates/DelegateSettings';
import { Icon, IconName } from './icons/v2';
import { WalletAccount } from 'lib/shared/types';

const ConfirmPage: FC = () => {
  const { ready } = useMidenContext();

  return useMemo(
    () =>
      ready ? (
        <ContentContainer
          padding={false}
          className={classNames('min-h-screen', 'flex flex-col items-center justify-center')}
        >
          <ErrorBoundary whileMessage={t('fetchingConfirmationDetails')}>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-screen">
                  <div>
                    <Spinner />
                  </div>
                </div>
              }
            >
              <ConfirmDAppForm />
            </Suspense>
          </ErrorBoundary>
        </ContentContainer>
      ) : (
        <Unlock canImportNew={false} />
      ),
    [ready]
  );
};

function downloadData(filename: string, data: string) {
  const blob = new Blob([data], { type: 'application/json' });
  const link = document.createElement('a');

  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}

interface PayloadContentProps {
  payload: MidenDAppPayload;
  account?: WalletAccount;
  viewKey?: string;
  error?: any;
}

const PayloadContent: React.FC<PayloadContentProps> = ({ payload, error, account }) => {
  let content: string | React.ReactNode = t('noPreview');
  switch (payload.type) {
    case 'transaction': {
      content = (
        <div>
          <div className="text-sm" key={0}>
            {payload.transactionMessages[0]} <br />
            {payload.transactionMessages[1]}
          </div>
          {account && (
            <>
              <hr className="h-px bg-grey-100 my-4" />
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('account')}</span>
                <div className="text-black flex flex-col items-end">
                  <span>{account.name}</span>
                  <span>{account.publicKey}</span>
                </div>
              </div>
            </>
          )}
          <hr className="h-px bg-grey-100 my-4" />
          {payload.transactionMessages.slice(2).map((message, i) => {
            const messageParts = message.split(', ');
            return (
              <div className="flex justify-between my-2 text-sm" key={i + 2}>
                <span className="text-gray-600">{messageParts[0]}</span>
                <span className="text-black">{messageParts[1]}</span>
              </div>
            );
          })}
        </div>
      );
      break;
    }
  }
  return (
    <div className={classNames('w-full', 'flex flex-col')}>
      {t(`Payload`) && (
        <h2 className={classNames('mb-2', 'leading-tight', 'flex flex-col')}>
          <T id={`Payload`}>
            {message => (
              <span className="text-black font-medium" style={{ fontSize: '14px', lineHeight: '20px' }}>
                {message}
              </span>
            )}
          </T>
        </h2>
      )}
      <span className="text-sm text-black">{!!error ? error : content}</span>
    </div>
  );
};

export default ConfirmPage;

const ConfirmDAppForm: FC = () => {
  const { getDAppPayload, confirmDAppPermission, confirmDAppTransaction } = useMidenContext();
  const account = useAccount();

  const loc = useLocation();
  const id = useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const pageId = usp.get('id');
    if (!pageId) {
      throw new Error(t('notIdentified'));
    }
    return pageId;
  }, [loc.search]);

  const { data } = useRetryableSWR<MidenDAppPayload>([id], getDAppPayload, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const payload = data!;
  const payloadError = data!.error;
  let requireDecryptCheckbox = false;
  let decryptPermission = DecryptPermission.NoDecrypt;
  if (payload.type === 'connect') {
    decryptPermission = payload.decryptPermission;
    if (payload.existingPermission) {
      confirmDAppPermission(id, true, account.publicKey, decryptPermission);
    }
  }
  requireDecryptCheckbox = decryptPermission === DecryptPermission.OnChainHistory;
  const [isDecryptChecked, setDecryptChecked] = useState(false);
  const delegate = isDelegateProofEnabled();

  const onConfirm = useCallback(
    async (confirmed: boolean) => {
      switch (payload.type) {
        case 'connect':
          return confirmDAppPermission(id, confirmed, account.publicKey, decryptPermission);
        case 'transaction':
          !delegate && openLoadingFullPage();
          return confirmDAppTransaction(id, confirmed, delegate);
      }
    },
    [id, payload.type, confirmDAppPermission, account.publicKey, decryptPermission, confirmDAppTransaction, delegate]
  );

  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const confirm = useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        if (confirmed && requireDecryptCheckbox && !isDecryptChecked) {
          throw new Error(t('confirmError'));
        }
        await onConfirm(confirmed);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError(err);
      }
    },
    [onConfirm, setError, isDecryptChecked, requireDecryptCheckbox]
  );

  const handleConfirmClick = useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    await confirm(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  const handleDeclineClick = useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    await confirm(false);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  const handleErrorAlertClose = useCallback(() => setError(null), [setError]);

  const content = useMemo(() => {
    switch (payload.type) {
      case 'connect':
        return {
          title: 'Connect to website',
          declineActionTitle: 'Deny',
          declineActionTestID: ConfirmPageSelectors.ConnectAction_CancelButton,
          confirmActionTitle: error ? t('retry') : t('connect'),
          confirmActionTestID: error
            ? ConfirmPageSelectors.ConnectAction_RetryButton
            : ConfirmPageSelectors.ConnectAction_ConnectButton,
          want: <DecryptPermissionBanner decryptPermission={decryptPermission} programs={payload.programs} />
        };
      case 'transaction':
        return {
          title: t('confirmAction', t('transactionAction')),
          declineActionTitle: t('cancel'),
          declineActionTestID: ConfirmPageSelectors.TransactionAction_RejectButton,
          confirmActionTitle: t('confirm'),
          confirmActionTestID: ConfirmPageSelectors.TransactionAction_AcceptButton,
          want: (
            <div
              className={classNames(
                'text-sm text-left text-black',
                'flex w-full gap-x-3 items-center p-4',
                'border border-gray-100 rounded-2xl mb-4'
              )}
            >
              <Icon name={IconName.Globe} fill="black" size="md" />
              <div className="flex flex-col">
                <Name className="font-semibold">{payload.origin}</Name>
                <span>Requests a transaction</span>
              </div>
            </div>
          )
        };
    }
  }, [error, payload]);

  return (
    <CustomRpsContext.Provider value={'TODO'}>
      <div
        className={classNames('relative bg-white rounded-md shadow-md overflow-y-auto', 'flex flex-col')}
        style={{
          width: 380,
          height: 610
        }}
      >
        <div className="flex flex-col items-left px-4">
          <h2 className="py-6 flex text-black text-lg font-semibold">{content.title}</h2>

          {payload.type === 'connect' && (
            <ConnectBanner type={payload.type} origin={payload.origin} appMeta={payload.appMeta} />
          )}

          {content.want}

          {error ? (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title="Error"
              description={error?.message ?? t('smthWentWrong')}
              className="my-4"
              autoFocus
            />
          ) : (
            <>
              {payload.type === 'connect' ? (
                account && (
                  <AccountBanner
                    account={account}
                    networkRpc={payload.networkRpc}
                    labelIndent="sm"
                    className="w-full my-2"
                  />
                )
              ) : (
                <PayloadContent payload={payload} error={payloadError} account={account} />
              )}
            </>
          )}
        </div>

        <div className="flex-1" />

        <div
          className={classNames('sticky bottom-0 w-full', 'bg-white shadow-md', 'flex items-stretch', 'px-4 pt-2 pb-6')}
        >
          <div className="w-1/2 pr-2">
            <Button
              type="button"
              variant={ButtonVariant.Secondary}
              className={classNames('w-full', 'px-8', 'text-black font-medium', 'transition duration-200 ease-in-out')}
              style={{
                fontSize: '16px',
                lineHeight: '24px',
                padding: '14px 0px',
                border: 'none'
              }}
              isLoading={declining}
              onClick={handleDeclineClick}
            >
              {content.declineActionTitle}
            </Button>
          </div>

          <div className="w-1/2 pl-2">
            <FormSubmitButton
              type="button"
              className="w-full justify-center justify-center rounded-lg py-3"
              style={{ fontSize: '16px', lineHeight: '24px', padding: '14px 0px', border: 'none' }}
              loading={confirming}
              onClick={handleConfirmClick}
              testID={content.confirmActionTestID}
            >
              {content.confirmActionTitle}
            </FormSubmitButton>
          </div>
        </div>
      </div>
    </CustomRpsContext.Provider>
  );
};
