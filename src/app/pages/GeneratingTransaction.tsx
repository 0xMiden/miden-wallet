/* eslint-disable @typescript-eslint/no-unused-expressions */

import React, { FC, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import CircularProgress from 'app/atoms/CircularProgress';
import { closeLoadingFullPage } from 'app/env';
import useBeforeUnload from 'app/hooks/useBeforeUnload';
import { ReactComponent as WarningIcon } from 'app/icons/warning-alt.svg';
import PageLayout from 'app/layouts/PageLayout';
import { isAutoCloseEnabled } from 'app/templates/AutoCloseSettings';

import { formatTransactionStatus, ITransactionStatus } from 'lib/aleo/db/transaction-types';
import { useAleoClient, useAllAccounts } from 'lib/aleo/front';
import { useFilteredContacts } from 'lib/aleo/front/use-filtered-contacts.hook';
import { useAnalytics } from 'lib/analytics';
import { t, T } from 'lib/i18n/react';
import { useRetryableSWR } from 'lib/swr';

import { GeneratingTransactionSelectors } from './GeneratingTransaction.selectors';

const GeneratingTransaction: FC = () => {
  const accounts = useAllAccounts();
  const [displayMessage, setDisplayMessage] = useState('');
  const { pageEvent, trackEvent, performanceEvent } = useAnalytics();
  const { allContacts } = useFilteredContacts();
  const { authorizeDeploy } = useAleoClient();

  useEffect(() => {
    pageEvent('GeneratingTransaction', '');
  }, [pageEvent]);

  const transactions: any = [];
  const canCancelTransaction = transactions.length > 0 && transactions[0].status !== ITransactionStatus.Broadcasting;
  const statusMessage =
    transactions.length > 0 ? `${t('status')}: ${formatTransactionStatus(transactions[0].status)}` : '';

  const prevTransactionsLength = useRef<number>();
  useEffect(() => {
    if (transactions.length > 0) {
      // TODO
    } else if (prevTransactionsLength.current && prevTransactionsLength.current > 0 && transactions.length === 0) {
      setDisplayMessage(t('noTransactionsRemaining'));
      new Promise(res => setTimeout(res, 10_000)).then(async () => {
        await trackEvent('GeneratingTransaction Page Closed Automatically');
        isAutoCloseEnabled() && closeLoadingFullPage();
      });
    }

    prevTransactionsLength.current = transactions.length;
  }, [transactions, trackEvent]);

  const cancelTx = async () => {
    canCancelTransaction;
  };

  useBeforeUnload(t('generatingTransactionWarning'), transactions.length !== 0);
  const progress = transactions.length > 0 ? statusToProgress(transactions[0].status) : 0;

  return (
    <PageLayout
      pageTitle={
        <div className="font-semibold" style={{ fontSize: '18px', lineHeight: '24px' }}>
          <T id="generatingTransaction" />
        </div>
      }
      hasBackAction={false}
    >
      <div>
        <div className={classNames('w-full max-w-sm mx-auto')}>
          <div
            className="flex flex-col items-center justify-center m-auto"
            style={{
              marginTop: '48px',
              width: '160px',
              height: '160px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='160' height='160' viewBox='0 0 160 160' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg clip-path='url(%23clip0_4733_10154)'%3E%3Crect x='-142' y='34' width='284' height='248' fill='url(%23paint0_radial_4733_10154)'/%3E%3Crect x='90' y='-68' width='284' height='248' fill='url(%23paint1_radial_4733_10154)'/%3E%3C/g%3E%3Cdefs%3E%3CradialGradient id='paint0_radial_4733_10154' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(0 158) rotate(90) scale(124 142)'%3E%3Cstop stop-color='%23EFE0FB'/%3E%3Cstop offset='1' stop-color='%23EFE0FB' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='paint1_radial_4733_10154' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(232 56) rotate(90) scale(124 142)'%3E%3Cstop stop-color='%23EFE0FB'/%3E%3Cstop offset='1' stop-color='%23EFE0FB' stop-opacity='0'/%3E%3C/radialGradient%3E%3CclipPath id='clip0_4733_10154'%3E%3Crect width='160' height='160' rx='80' fill='white'/%3E%3C/clipPath%3E%3C/defs%3E%3C/svg%3E")`
            }}
          >
            <CircularProgress borderWeight={6} progress={progress} circleColor="#634CFF" circleSize={50} spin={true} />
          </div>
          <div
            className="flex flex-col pt-6 items-center text-black font-medium text-center"
            style={{ fontSize: '18px', lineHeight: '24px' }}
          >
            {displayMessage}
          </div>
          <div
            className="flex flex-col mt-1 pb-8 items-center text-black text-center"
            style={{ fontSize: '14px', lineHeight: '20px' }}
          >
            {statusMessage}&nbsp;
          </div>
        </div>
        <div
          className="flex w-full max-w-sm mx-auto text-center mt-6 rounded-lg bg-yellow-500"
          style={{ fontSize: '14px', lineHeight: '20px', padding: '18px 28px' }}
        >
          <WarningIcon stroke={'none'} style={{ height: '16px', width: '16px', marginTop: '2px' }} />
          <div className="flex flex-col px-2 text-left">
            <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px', marginBottom: '4px' }}>
              DO NOT CLOSE THIS WINDOW <br />
            </span>
            <span className="text-xs">Window will auto-close after the transaction is generated</span>
          </div>
        </div>
        <div className={classNames('w-full max-w-sm mx-auto mt-2')}>
          <div className="flex flex-col items-start text-black py-1">
            <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px' }}>
              ETA: Computer speed matters
              <br />
            </span>
            <span style={{ fontSize: '12px', lineHeight: '16px' }}>This could take several minutes</span>
          </div>
        </div>
        <div className={classNames('w-full pt-2 pb-8 px-4 mt-24')}>
          <Button
            className={`w-full justify-center border-none font-semibold text-sm`}
            style={{
              padding: '12px 2rem',
              fontSize: '16px',
              lineHeight: '24px',
              background: '#B10606',
              color: '#ffffff',
              marginTop: '8px',
              borderRadius: 4,
              opacity: `${canCancelTransaction ? '1' : '0.5'}`
            }}
            disabled={!canCancelTransaction}
            onClick={() => cancelTx()}
            testID={GeneratingTransactionSelectors.CancelButton}
          >
            Cancel Transaction
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

function statusToProgress(status: ITransactionStatus): number {
  switch (status) {
    case ITransactionStatus.Queued:
      return 5;
    case ITransactionStatus.DownloadingProverFiles:
      return 25;
    case ITransactionStatus.GeneratingTransaction:
      return 50;
    case ITransactionStatus.GeneratingDeployment:
      return 50;
    case ITransactionStatus.Broadcasting:
      return 100;
  }
  return 0;
}

export default GeneratingTransaction;
