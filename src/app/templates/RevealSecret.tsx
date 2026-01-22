import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import classNames from 'clsx';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { Icon, IconName } from 'app/icons/v2';
import AccountBanner from 'app/templates/AccountBanner';
import { useAccount, useSecretState, useMidenContext } from 'lib/miden/front';
import { getMidenClient, withWasmClientLock } from 'lib/miden/sdk/miden-client';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

const SUBMIT_ERROR_TYPE = 'submit-error';

type FormData = {
  password: string;
};

type RevealSecretProps = {
  reveal: 'private-key' | 'seed-phrase';
};

const RevealSecret: FC<RevealSecretProps> = ({ reveal }) => {
  const { t } = useTranslation();
  const { revealMnemonic, revealPrivateKey } = useMidenContext();
  const account = useAccount();
  const { fieldRef: secretFieldRef, copy, copied } = useCopyToClipboard();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<FormData>();
  const [secret, setSecret] = useSecretState();

  useEffect(() => {
    if (account.publicKey) {
      return () => setSecret(null);
    }
    return undefined;
  }, [account.publicKey, setSecret]);

  useEffect(() => {
    if (secret) {
      secretFieldRef.current?.focus();
      secretFieldRef.current?.select();
    }
  }, [secret, secretFieldRef]);

  const formRef = useRef<HTMLFormElement>(null);

  const focusPasswordField = useCallback(() => {
    formRef.current?.querySelector<HTMLInputElement>("input[name='password']")?.focus();
  }, []);

  useLayoutEffect(() => {
    focusPasswordField();
  }, [focusPasswordField]);

  const onSubmit = useCallback<SubmitHandler<FormData>>(
    async ({ password }) => {
      if (isSubmitting) return;
      console.log('Revealing secret...');
      clearErrors('password');
      try {
        let secret;
        if (reveal === 'private-key') {
          const pkc = await withWasmClientLock(async () => {
            const client = await getMidenClient();
            return client.getAccountPkcByPublicKey(account.publicKey);
          });
          secret = await revealPrivateKey(pkc, password);
          console.log('Revealed private key');
        } else {
          secret = await revealMnemonic(password);
        }
        setSecret(secret);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', { type: SUBMIT_ERROR_TYPE, message: err.message });
        focusPasswordField();
      }
    },
    [
      isSubmitting,
      clearErrors,
      setError,
      revealMnemonic,
      revealPrivateKey,
      setSecret,
      focusPasswordField,
      reveal,
      account.publicKey
    ]
  );

  const texts = useMemo(() => {
    switch (reveal) {
      case 'private-key':
        return {
          name: t('privateKey'),
          accountBanner: (
            <AccountBanner
              labelDescription={t('ifYouWantToRevealPrivateKeyFromOtherAccount')}
              account={account}
              className="mb-6"
            />
          ),
          attention: (
            <div className="flex flex-col text-left text-black">
              <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px', marginBottom: '4px' }}>
                {t('doNotSharePrivateKey1')} <br />
              </span>
              <span className="text-xs">{t('doNotSharePrivateKey2')}</span>
            </div>
          ),
          fieldDesc: <>{t('privateKeyFieldDescription')}</>
        };

      case 'seed-phrase':
        return {
          name: t('seedPhrase'),
          accountBanner: null,
          attention: (
            <div className="flex flex-col text-left text-black">
              <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px', marginBottom: '4px' }}>
                {t('doNotSharePhrase1')} <br />
              </span>
              <span className="text-xs">{t('doNotSharePhrase2')}</span>
            </div>
          ),
          fieldDesc: (
            <>
              {t('youWillNeedThisSeedPhrase')} {t('keepSeedPhraseSecret')}
            </>
          )
        };
    }
  }, [reveal, account, t]);
  const mainContent = useMemo(() => {
    if (secret) {
      return (
        <>
          <FormField
            ref={secretFieldRef}
            secret
            textarea
            rows={4}
            readOnly
            label={texts.name}
            labelDescription={<div className="mb-3">{texts.fieldDesc}</div>}
            labelWarning={
              <Alert
                description={
                  <div>
                    <div
                      className="flex w-full max-w-sm mx-auto text-center rounded-lg bg-yellow-300"
                      style={{ fontSize: '14px', lineHeight: '20px' }}
                    >
                      <Icon
                        name={IconName.Warning}
                        fill="black"
                        style={{ height: '16px', width: '40px', marginTop: '2px' }}
                      />
                      {texts.attention}
                    </div>
                  </div>
                }
                className="bg-yellow-300 rounded-lg text-black"
              />
            }
            id="reveal-secret-secret"
            spellCheck={false}
            className="resize-none notranslate"
            value={secret}
          />

          <div className="flex">
            <button
              type="button"
              className={classNames(
                'w-full mt-2 mb-6',
                'py-4 px-2 w-40',
                'hover:bg-gray-700',
                'active:bg-gray-100',
                'flex items-center justify-center',
                'text-black bg-gray-800 rounded-lg',
                'font-semibold',
                'transition duration-300 ease-in-out',
                'opacity-90 hover:opacity-100 focus:opacity-100',
                'shadow-sm',
                'hover:shadow focus:shadow'
              )}
              style={{ fontSize: '16px', lineHeight: '24px' }}
              onClick={copy}
            >
              {copied ? t('copiedAddress') : t('copyAddressToClipboard')}
            </button>
          </div>
        </>
      );
    }

    return (
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <FormField
          {...register('password', { required: t('required') })}
          label={t('password')}
          labelDescription={t('revealSecretPasswordInputDescription', { secretName: texts.name })}
          id="reveal-secret-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          containerClassName="mb-4"
          onChange={() => clearErrors()}
        />

        <FormSubmitButton
          className="capitalize w-full justify-center mt-6"
          loading={isSubmitting}
          style={{
            fontSize: '18px',
            lineHeight: '24px',
            paddingLeft: '0.5rem',
            paddingRight: '0.5rem',
            paddingTop: '12px',
            paddingBottom: '12px'
          }}
        >
          {t('reveal')}
        </FormSubmitButton>
      </form>
    );
  }, [
    errors,
    handleSubmit,
    onSubmit,
    register,
    secret,
    texts,
    isSubmitting,
    clearErrors,
    copy,
    copied,
    secretFieldRef,
    t
  ]);

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      {texts.accountBanner}

      {mainContent}
    </div>
  );
};

export default RevealSecret;
