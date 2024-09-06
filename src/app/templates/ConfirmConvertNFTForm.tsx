import React, { FC, Suspense, useCallback } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import { Button } from 'app/atoms/Button';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import Spinner from 'app/atoms/Spinner/Spinner';
import { openLoadingFullPage, useAppEnv } from 'app/env';
import { ReactComponent as PublicGlobeIcon } from 'app/icons/globe.svg';
import { ReactComponent as PrivateLockIcon } from 'app/icons/lock.svg';

import { useAccount, useAleoClient } from 'lib/aleo/front';
import { ALEO_DECIMALS } from 'lib/fiat-curency/consts';
import { formatBigInt } from 'lib/i18n/numbers';
import { t, T } from 'lib/i18n/react';
import Link from 'lib/woozie/Link';

import { ConvertNFTVisibilityFormSelectors } from './ConvertNFTForm.selectors';
import { isDelegateProofEnabled } from './DelegateSettings';
import { INFT } from './NFTs/INFT';

interface FormData {
  nft: INFT;
  fee: number;
  feePrivate: boolean;
}

type ConfirmConvertNFTFormProps = {
  nft: INFT;
  fee: bigint;
  feePrivate: boolean;
  setConfirmStatus: (delegated: boolean) => void;
};

const ConfirmNFTForm: FC<ConfirmConvertNFTFormProps> = ({ nft, fee, feePrivate, setConfirmStatus }) => {
  return (
    <>
      <Suspense fallback={<SpinnerSection />}>
        {nft && <Form setConfirmStatus={setConfirmStatus} nft={nft} fee={fee} feePrivate={feePrivate} />}
      </Suspense>
    </>
  );
};

export default ConfirmNFTForm;

type FormProps = {
  nft: INFT;
  fee: bigint;
  feePrivate: boolean;
  setConfirmStatus: (delegated: boolean) => void;
};

const Form: FC<FormProps> = ({ nft, fee, feePrivate, setConfirmStatus }) => {
  const account = useAccount();
  const { fullPage } = useAppEnv();
  const delegateTransaction = isDelegateProofEnabled();
  const { authorizeTransaction } = useAleoClient();
  /**
   * Form
   */

  const { handleSubmit, formState } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {}
  });

  const onSubmit = useCallback(async () => {
    if (formState.isSubmitting) return;

    try {
      // Add transaction (+ transition) to repo
      // Open generating page to process it
      if (!delegateTransaction) await openLoadingFullPage();
      setConfirmStatus(delegateTransaction);
    } catch (err: any) {
      if (err.message === 'Declined') {
        return;
      }

      console.error(err);

      // Human delay.
      await new Promise(res => setTimeout(res, 300));
    }
  }, [
    formState.isSubmitting,
    account,
    setConfirmStatus,
    nft,
    fee,
    feePrivate,
    authorizeTransaction,
    delegateTransaction
  ]);

  const publicNFTSection = (
    <div className="flex items-center">
      <PublicGlobeIcon fill="#656565" height="16px" width="16px" />
      <div className="ml-1 text-base" style={{ color: '#656565' }}>{`${t('public')} ${t('nft')}`}</div>
    </div>
  );
  const privateNFTSection = (
    <div className="flex items-center">
      <PrivateLockIcon fill="#656565" height="16px" width="16px" />
      <div className="ml-1 text-base" style={{ color: '#656565' }}>{`${t('private')} ${t('nft')}`}</div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="pt-2">
        <div className={classNames('w-full', 'font-medium')} style={{ fontSize: '14px', lineHeight: '20px' }}>
          {t('converting')}
        </div>
        <div className="flex justify-start mt-4">
          <img
            crossOrigin="anonymous"
            className="object-contain rounded-lg border-2 border-opacity-90"
            src={nft.imageURI}
            alt={nft.symbol}
            style={{ height: '72px' }}
          />
          <span className="text-left text-lg px-4" style={{ lineHeight: '72px', color: '#656565' }}>
            {nft.collectionName || nft.symbol} {nft.mintNumber && `#${nft.mintNumber}`}
          </span>
        </div>
        <div
          className={classNames('w-full', 'font-medium')}
          style={{ marginTop: '20px', fontSize: '14px', lineHeight: '20px' }}
        >
          {t('from')}
        </div>
        <div className={classNames('w-full')} style={{ fontSize: '14px', lineHeight: '20px' }}>
          <span className="text-gray-200" style={{ wordBreak: 'break-all' }}>
            {nft.isPrivate ? privateNFTSection : publicNFTSection}
          </span>
        </div>
        <div
          className={classNames('w-full', 'font-medium')}
          style={{ marginTop: '20px', fontSize: '14px', lineHeight: '20px' }}
        >
          {t('to')}
        </div>
        <div className={classNames('w-full')} style={{ fontSize: '14px', lineHeight: '20px' }}>
          <span className="text-gray-200" style={{ wordBreak: 'break-all' }}>
            {nft.isPrivate ? publicNFTSection : privateNFTSection}
          </span>
        </div>
        <div
          className={classNames('w-full flex', 'font-medium')}
          style={{ marginTop: '20px', fontSize: '14px', lineHeight: '20px' }}
        >
          <span>{t('fee')}</span>
        </div>
        <div className={classNames('w-full')} style={{ fontSize: '14px', lineHeight: '20px' }}>
          <span className="text-gray-200" style={{ wordBreak: 'break-all' }}>
            {formatBigInt(fee, ALEO_DECIMALS)}
          </span>
        </div>
      </div>
      <div
        className={`flex flex-col justify-end ${fullPage ? 'mb-8' : 'mb-2'}`}
        style={{ maxHeight: 'fit-content', height: `${fullPage ? '14rem' : '10rem'}` }}
      >
        <div className="flex flex-row justify-between w-full">
          <T id="cancel">
            {message => (
              <Link to="/" style={{ width: '48%' }} testID={ConvertNFTVisibilityFormSelectors.CancelConfirmButton}>
                <Button
                  className={classNames(
                    'w-full justify-center',
                    'px-8',
                    'rounded-lg',
                    'bg-gray-800',
                    'hover:bg-gray-700',
                    'active:bg-gray-600',
                    'flex items-center',
                    'text-black',
                    'font-semibold',
                    'transition duration-200 ease-in-out'
                  )}
                  style={{
                    fontSize: '16px',
                    lineHeight: '24px',
                    padding: '14px 0px'
                  }}
                >
                  {message}
                </Button>
              </Link>
            )}
          </T>
          <T id="confirm">
            {message => (
              <FormSubmitButton
                loading={formState.isSubmitting}
                className="justify-center rounded-lg py-3"
                style={{ width: '48%', fontSize: '16px', lineHeight: '24px', padding: '14px 0px', border: 'none' }}
                testID={ConvertNFTVisibilityFormSelectors.ConfirmButton}
              >
                {message}
              </FormSubmitButton>
            )}
          </T>
        </div>
      </div>
    </form>
  );
};

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-8">
    <Spinner />
  </div>
);
