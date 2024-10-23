import React, { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import classNames from 'clsx';
import { OnSubmit, useForm } from 'react-hook-form';

import Alert from 'app/atoms/Alert';
import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { getAccountBadgeTitle } from 'app/defaults';
import { Icon, IconName } from 'app/icons/v2';
import AccountBanner from 'app/templates/AccountBanner';
import { useAccount, useSecretState, useMidenContext } from 'lib/miden/front';
import { T, t } from 'lib/i18n/react';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';

const SUBMIT_ERROR_TYPE = 'submit-error';

type FormData = {
  password: string;
};

type RevealSecretProps = {
  reveal: 'view-key' | 'private-key' | 'seed-phrase';
};

const RevealSecret: FC<RevealSecretProps> = ({ reveal }) => {
  const { revealViewKey, revealPrivateKey, revealMnemonic } = useMidenContext();
  const account = useAccount();
  const { fieldRef: secretFieldRef, copy, copied } = useCopyToClipboard();

  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();
  const submitting = formState.isSubmitting;

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

  const onSubmit = useCallback<OnSubmit<FormData>>(
    async ({ password }) => {
      if (submitting) return;

      clearError('password');
      try {
        let scrt: string;

        setSecret('scrt');
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError('password', SUBMIT_ERROR_TYPE, err.message);
        focusPasswordField();
      }
    },
    [
      reveal,
      submitting,
      clearError,
      setError,
      revealViewKey,
      revealPrivateKey,
      revealMnemonic,
      account.publicKey,
      setSecret,
      focusPasswordField
    ]
  );

  const texts = useMemo(() => {
    switch (reveal) {
      case 'view-key':
        return {
          name: t('viewKey'),
          accountBanner: (
            <AccountBanner labelDescription={t('ifYouWantToRevealViewKeyFromOtherAccount')} className="mb-6" />
          ),
          derivationPathBanner: 'account.derivationPath' && (
            <div className="mb-6 flex flex-col">
              <label className="mb-4 flex flex-col">
                <span className="text-black font-semibold">
                  <T id="derivationPath" />
                </span>
              </label>
              <input
                className={classNames(
                  'appearance-none',
                  'w-full',
                  'py-3 pl-4',
                  'border-2',
                  'border-gray-300',
                  'bg-transparent',
                  'rounded-md',
                  'text-black text-lg leading-tight'
                )}
                disabled={true}
              />
            </div>
          ),
          attention: (
            <div className="flex flex-col text-left text-black">
              <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px', marginBottom: '4px' }}>
                {t('doNotShareViewKey1')} <br />
              </span>
              <span className="text-xs">{t('doNotShareViewKey2')}</span>
            </div>
          ),
          fieldDesc: <T id="viewKeyFieldDescription" />
        };

      case 'private-key':
        return {
          name: t('privateKey'),
          accountBanner: (
            <AccountBanner labelDescription={t('ifYouWantToRevealPrivateKeyFromOtherAccount')} className="mb-6" />
          ),
          derivationPathBanner: 'account.derivationPath' && (
            <div className="mb-6 flex flex-col">
              <label className="mb-4 flex flex-col">
                <span className="text-black font-semibold">
                  <T id="derivationPath" />
                </span>
              </label>
              <input
                className={classNames(
                  'appearance-none',
                  'w-full',
                  'py-3 pl-4',
                  'border-2',
                  'border-gray-300',
                  'bg-transparent',
                  'rounded-md',
                  'text-black text-lg leading-tight'
                )}
                disabled={true}
              />
            </div>
          ),
          attention: (
            <div className="flex flex-col text-left text-black">
              <span className="font-medium" style={{ fontSize: '14px', lineHeight: '20px', marginBottom: '4px' }}>
                {t('doNotSharePrivateKey1')} <br />
              </span>
              <span className="text-xs">{t('doNotSharePrivateKey2')}</span>
            </div>
          ),
          fieldDesc: <T id="privateKeyFieldDescription" />
        };

      case 'seed-phrase':
        return {
          name: t('seedPhrase'),
          accountBanner: null,
          derivationPathBanner: (
            <div className={classNames('mb-6 mt-4', 'flex flex-col')}>
              <h2 className={classNames('mb-4', 'leading-tight', 'flex flex-col')}>
                <T id="derivationPath">
                  {message => (
                    <span className="text-black font-medium" style={{ fontSize: '14px', lineHeight: '20px' }}>
                      {message}
                    </span>
                  )}
                </T>

                <T id="pathForHDAccounts">
                  {message => (
                    <span className={classNames('mt-2', 'text-xs  text-black')} style={{ maxWidth: '90%' }}>
                      {message}
                    </span>
                  )}
                </T>
              </h2>

              <div className={classNames('w-full', 'border rounded-md', 'p-2', 'flex items-center')}>
                <T id="derivationPathExample">
                  {message => <span className="text-sm font-medium text-black">{message}</span>}
                </T>
              </div>
            </div>
          ),
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
              <T id="youWillNeedThisSeedPhrase" /> <T id="keepSeedPhraseSecret" />
            </>
          )
        };
    }
  }, [reveal, account]);

  const forbidPrivateKeyRevealing = reveal === 'private-key';
  const mainContent = useMemo(() => {
    if (forbidPrivateKeyRevealing) {
      return (
        <Alert
          title={t('privateKeyCannotBeRevealed')}
          description={
            <p>
              <T
                id="youCannotGetPrivateKeyFromThisAccountType"
                substitutions={[
                  <span
                    key="account-type"
                    className={classNames('rounded-sm', 'border', 'px-1 py-px', 'font-normal leading-tight')}
                    style={{
                      fontSize: '0.75em',
                      borderColor: 'currentColor'
                    }}
                  >
                    {getAccountBadgeTitle()}
                  </span>
                ]}
              />
            </p>
          }
          className="mb-4 bg-blue-200 border-primary-500 rounded-none text-black"
        />
      );
    }

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
                'active:bg-gray-600',
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
              {copied ? (
                <T id="copiedAddress" />
              ) : (
                <>
                  <T id="copyAddressToClipboard" />
                </>
              )}
            </button>
          </div>
        </>
      );
    }

    return (
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: t('required') })}
          label={t('password')}
          labelDescription={t('revealSecretPasswordInputDescription', texts.name)}
          id="reveal-secret-password"
          type="password"
          name="password"
          placeholder="********"
          errorCaption={errors.password?.message}
          containerClassName="mb-4"
          onChange={() => clearError()}
        />

        <T id="reveal">
          {message => (
            <FormSubmitButton
              className="capitalize w-full justify-center mt-6"
              loading={submitting}
              style={{
                fontSize: '18px',
                lineHeight: '24px',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
                paddingTop: '12px',
                paddingBottom: '12px'
              }}
            >
              {message}
            </FormSubmitButton>
          )}
        </T>
      </form>
    );
  }, [
    account,
    forbidPrivateKeyRevealing,
    errors,
    handleSubmit,
    onSubmit,
    register,
    secret,
    texts,
    submitting,
    clearError,
    copy,
    copied,
    secretFieldRef
  ]);

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      {texts.accountBanner}

      {texts.derivationPathBanner}

      {mainContent}
    </div>
  );
};

export default RevealSecret;
