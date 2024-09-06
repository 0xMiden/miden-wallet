import React, { FC, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import classNames from 'clsx';
import { Controller, useForm } from 'react-hook-form';

import { Button } from 'app/atoms/Button';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import NoSpaceField from 'app/atoms/NoSpaceField';
import Spinner from 'app/atoms/Spinner/Spinner';
import { RECOMMENDED_FEES } from 'app/constants';
import { useAppEnv } from 'app/env';
import { ALEO_SLUG, ALEO_TOKEN_ID } from 'lib/aleo/assets/constants';
import { isAddressValid, useAccount, useBalance } from 'lib/aleo/front';
import { useFilteredContacts } from 'lib/aleo/front/use-filtered-contacts.hook';
import { validateDelegate } from 'lib/aleo/front/validate-delegate';
import { ALEO_DECIMALS } from 'lib/fiat-curency/consts';
import { formatBigInt } from 'lib/i18n/numbers';
import { T, t } from 'lib/i18n/react';
import useTippy from 'lib/ui/useTippy';
import Link from 'lib/woozie/Link';

import CustomizeFee from './CustomizeFee';
import { INFT } from './NFTs/INFT';
import AddContactModal from './SendForm/AddContactModal';
import ContactsDropdown from './SendForm/ContactsDropdown';
import { SendNFTFormSelectors } from './SendNFTForm.selectors';

interface FormData {
  nft: INFT;
  to: string;
  amount: string;
}

type SendNFTFormProps = {
  nft: INFT;
  setSendInfo: (to: string, fee: bigint, feePrivate: boolean) => void;
};

const SendNFTForm: FC<SendNFTFormProps> = ({ nft, setSendInfo }) => {
  let RECOMMENDED_FEE = nft.isPrivate ? RECOMMENDED_FEES.SEND_NFT_PRIVATE : RECOMMENDED_FEES.SEND_NFT_PUBLIC;
  const [addContactModalAddress, setAddContactModalAddress] = useState<string | null>(null);
  const [fee, setFee] = useState<bigint>(RECOMMENDED_FEE);
  const [feePrivate, setFeePrivate] = useState<boolean>(true);
  const [editingFee, setEditingFee] = useState(false);

  const account = useAccount();

  const handleAddContactRequested = useCallback(
    (address: string) => {
      setAddContactModalAddress(address);
    },
    [setAddContactModalAddress]
  );

  const closeContactModal = useCallback(() => {
    setAddContactModalAddress(null);
  }, [setAddContactModalAddress]);

  return (
    <>
      <Suspense fallback={<SpinnerSection />}>
        {editingFee && (
          <CustomizeFee
            fee={fee}
            feePrivate={feePrivate}
            recommendedFee={RECOMMENDED_FEE}
            allowOneCreditRecord={true}
            setFee={(amount: bigint) => {
              setFee(amount);
              setEditingFee(false);
            }}
            setFeePrivate={setFeePrivate}
            cancel={() => setEditingFee(false)}
          />
        )}
        {!editingFee && (
          <Form
            nft={nft}
            fee={fee}
            feePrivate={feePrivate}
            editFee={() => setEditingFee(true)}
            setSendInfo={setSendInfo}
            onAddContactRequested={handleAddContactRequested}
          />
        )}
      </Suspense>

      <AddContactModal address={addContactModalAddress} onClose={closeContactModal} />
    </>
  );
};

export default SendNFTForm;

type FormProps = {
  nft: INFT;
  fee: bigint;
  feePrivate: boolean;
  editFee: () => void;
  setSendInfo: (to: string, fee: bigint, feePrivate: boolean) => void;
  onAddContactRequested: (address: string) => void;
};

const Form: FC<FormProps> = ({ nft, fee, feePrivate, editFee, setSendInfo, onAddContactRequested }) => {
  const { fullPage, registerBackHandler } = useAppEnv();
  const assetSymbol = 'ALEO';
  const { allContacts } = useFilteredContacts();
  const acc = useAccount();
  const accountPk = acc.publicKey;
  const feeRef = useTippy<HTMLSpanElement>(feeTippyPropsMock);

  /**
   * Form
   */

  const { watch, handleSubmit, errors, control, formState, setValue, triggerValidation } = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {}
  });

  const toValue = watch('to');
  const toFieldRef = useRef<HTMLTextAreaElement>(null);
  const toFilledWithAddress = useMemo(() => Boolean(toValue), [toValue]);

  const cleanToField = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  useLayoutEffect(() => {
    if (toFilledWithAddress) {
      toFieldRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [toFilledWithAddress]);

  useLayoutEffect(() => {
    if (toFilledWithAddress) {
      return registerBackHandler(() => {
        cleanToField();
        window.scrollTo(0, 0);
      });
    }
    return undefined;
  }, [toFilledWithAddress, registerBackHandler, cleanToField]);

  const onSubmit = useCallback(
    async ({ to }: FormData) => {
      if (formState.isSubmitting) return;

      try {
        setSendInfo(to, fee, feePrivate);
      } catch (err: any) {
        if (err.message === 'Declined') {
          return;
        }

        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
      }
    },
    [formState.isSubmitting, setSendInfo, fee, feePrivate]
  );

  const handleAccountSelect = useCallback(
    (account: string) => {
      setValue('to', account);
      triggerValidation('to');
    },
    [setValue, triggerValidation]
  );

  const allContactsWithoutCurrent = useMemo(
    () => allContacts.filter(c => 'c.address' !== accountPk),
    [allContacts, accountPk]
  );

  const calculatedHeight = 4.25 - (errors.to?.message ? 0.9 : 0);

  return (
    <form style={{ minHeight: '24rem' }} onSubmit={handleSubmit(onSubmit)}>
      <div className="flex justify-start">
        <img
          crossOrigin="anonymous"
          className="object-contain rounded-lg border-2 border-opacity-90"
          src={nft.imageURI}
          alt={nft.symbol}
          style={{ height: '84px' }}
        />
        <span className="text-left text-lg font-medium text-black px-4" style={{ lineHeight: '84px' }}>
          {nft.collectionName || nft.symbol} {nft.mintNumber && `#${nft.mintNumber}`}
        </span>
      </div>
      <div className="flex justify-between" style={{ fontSize: '12px', lineHeight: '16px' }}>
        <div
          className="flex flex-col justify-start my-4 cursor-pointer"
          style={{ fontSize: '12px', lineHeight: '16px' }}
          onClick={editFee}
        >
          <span className="text-black font-medium">
            <div className="font-medium mt-4 mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>
              {t('fee')}
            </div>
          </span>
          <span ref={feeRef} className="text-black">{`${formatBigInt(fee, ALEO_DECIMALS)} ${assetSymbol}`}</span>
        </div>
      </div>
      <Controller
        name="to"
        as={<NoSpaceField ref={toFieldRef} />}
        control={control}
        // rules={{
        //   validate: (value: any) => validateDelegate(chainId as AleoChainId, value, t)
        // }}
        onChange={([v]) => v}
        textarea
        rows={2}
        cleanable={Boolean(toValue)}
        onClean={cleanToField}
        id="send-to"
        placeholder={'aleo142r2...'}
        errorCaption={errors.to?.message}
        style={{
          resize: 'none',
          fontSize: '16px',
          lineHeight: '24px'
        }}
        containerClassName="mb-2"
        label={
          <div className="font-medium mt-4 -mb-1" style={{ fontSize: '14px', lineHeight: '20px' }}>
            {t('recipient')}
          </div>
        }
      />
      <div className="font-medium mt-4 mb-2" style={{ fontSize: '14px', lineHeight: '20px' }}>
        {t('currentContacts')}
      </div>
      <div>
        <ContactsDropdown onSelect={handleAccountSelect} searchTerm={toValue} fullPage={fullPage} />
      </div>
      <div
        className={`flex flex-col justify-end ${fullPage ? 'mb-8' : 'mb-2'}`}
        style={{ maxHeight: 'fit-content', height: `${calculatedHeight}rem` }}
      >
        <div className="flex flex-row justify-between w-full">
          <T id="cancel">
            {message => (
              <Link to="/" style={{ width: '48%' }} testID={SendNFTFormSelectors.CancelSendButton}>
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
          <T id="next">
            {message => (
              <FormSubmitButton
                testID={SendNFTFormSelectors.SendButton}
                loading={formState.isSubmitting}
                className="justify-center rounded-lg py-3"
                style={{ width: '48%', fontSize: '16px', lineHeight: '24px', padding: '14px 0px', border: 'none' }}
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

const feeTippyPropsMock = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('feeToolTip'),
  animation: 'shift-away-subtle'
};
