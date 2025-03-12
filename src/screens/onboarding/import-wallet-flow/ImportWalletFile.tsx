import React, { useState, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button } from 'components/Button';
import { ONE_MB_IN_BYTES } from 'utils/crypto';
import { EncryptedWalletFile, ENCRYPTED_WALLET_FILE_PASSWORD_CHECK, DecryptedWalletFile } from 'screens/shared';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { decrypt, decryptJson, deriveKey, generateKey } from 'lib/miden/passworder';
import FormField, { PASSWORD_ERROR_CAPTION } from 'app/atoms/FormField';
import {
  lettersNumbersMixtureRegx,
  PASSWORD_PATTERN,
  specialCharacterRegx,
  uppercaseLowercaseMixtureRegx
} from 'app/defaults';
import { useForm } from 'react-hook-form';
import PasswordStrengthIndicator, { PasswordValidation } from 'lib/ui/PasswordStrengthIndicator';
import { MIN_PASSWORD_LENGTH } from 'app/pages/NewWallet/SetWalletPassword';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { T } from 'lib/i18n/react';

interface FormData {
  password?: string;
}

export interface ImportWalletFileScreenProps {
  className?: string;
  onSubmit?: (seedPhrase: string) => void;
}

type WalletFile = EncryptedWalletFile & {
  name: string;
};

const midenClient = await MidenClientInterface.create();

type ImportPasswordValidation = PasswordValidation & {
  validDecryption: boolean;
};

// TODO: This needs to move forward in the onboarding steps, likely needs some sort of next thing feature
export const ImportWalletFileScreen: React.FC<ImportWalletFileScreenProps> = ({ className, onSubmit }) => {
  const { t } = useTranslation();
  const walletFileRef = useRef<HTMLInputElement>(null);
  const [walletFile, setWalletFile] = useState<WalletFile | null>(null);
  const [isWrongPassword, setIsWrongPassword] = useState(false);

  const { control, watch, register, handleSubmit, errors, triggerValidation, formState } = useForm<FormData>({
    mode: 'onChange'
  });

  const filePassword = watch('password') ?? '';

  const handleClear = () => {
    setWalletFile(null);
  };

  const handleImportSubmit = async () => {
    if (!walletFile || !onSubmit) return;

    try {
      const passKey = await generateKey(filePassword);
      const saltByteArray = Object.values(walletFile.salt) as number[];
      const saltU8 = new Uint8Array(saltByteArray);
      const derivedKey = await deriveKey(passKey, saltU8);

      // First, try decrypting `encryptedPasswordCheck`
      const decryptedCheck = await decrypt(walletFile.encryptedPasswordCheck, derivedKey);

      if (decryptedCheck !== ENCRYPTED_WALLET_FILE_PASSWORD_CHECK) {
        setIsWrongPassword(true); // Show error div
        return;
      }

      // Reset wrong password error if it was previously set
      setIsWrongPassword(false);

      // Proceed with full decryption
      const decryptedWallet: DecryptedWalletFile = await decryptJson(
        { dt: walletFile.dt, iv: walletFile.iv },
        derivedKey
      );
      const dbContent = decryptedWallet.dbContent;
      const seedPhrase = decryptedWallet.seedPhrase;

      await midenClient.importDb(dbContent);

      onSubmit(seedPhrase);
    } catch (error) {
      console.error('Decryption failed:', error);
      setIsWrongPassword(true); // Ensure error appears in case of failure
    }
  };

  const handlePasswordChange = async (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const tempValue = e.target.value;

    // Basic password validation
    const minChar = tempValue.length >= MIN_PASSWORD_LENGTH;
    const cases = uppercaseLowercaseMixtureRegx.test(tempValue);
    const number = lettersNumbersMixtureRegx.test(tempValue);
    const specialChar = specialCharacterRegx.test(tempValue);

    let validDecryption = false;

    if (walletFile?.encryptedPasswordCheck) {
      try {
        const passKey = await generateKey(tempValue);
        const saltByteArray = Object.values(walletFile.salt) as number[];
        const saltU8 = new Uint8Array(saltByteArray);

        const derivedKey = await deriveKey(passKey, saltU8);

        // Decrypt the encryptedPasswordCheck field
        const decryptedCheck = await decrypt(walletFile.encryptedPasswordCheck, derivedKey);

        // Compare with expected string
        validDecryption = decryptedCheck === ENCRYPTED_WALLET_FILE_PASSWORD_CHECK;
      } catch (error) {
        console.error('Decryption failed:', error);
      }
    }
  };

  const onUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    // TODO error modals/alerts
    const { files } = e.target;
    if (files && files.length) {
      const file = files[0];
      const parts = file.name.split('.');
      const fileType = parts[parts.length - 1];
      const reader = new FileReader();

      if (fileType !== 'json') {
        alert('File type must be .json');
        return;
      }

      reader.onload = () => {
        try {
          const decoder = new TextDecoder();
          const decodedContent = decoder.decode(reader.result as ArrayBuffer);
          const jsonContent = JSON.parse(decodedContent);

          setWalletFile({ ...jsonContent, name: file.name });
        } catch (e) {
          console.error(e);
          alert('Invalid JSON file');
        }
      };

      reader.onerror = () => {
        alert('Error with file reader');
      };

      reader.readAsArrayBuffer(file);
    } else {
      alert('Select 1 file');
      return;
    }
  };

  const uploadFileComponent = (): JSX.Element => {
    const style = {
      color: '#0000EE',
      cursor: 'pointer'
    };
    return (
      <span onClick={onUploadFileClick} style={style}>
        {t('chooseFromDevice')}
      </span>
    );
  };

  const onUploadFileClick = () => {
    if (walletFileRef != null && walletFileRef.current != null) {
      walletFileRef.current.click();
    }
  };

  return (
    <form
      className={classNames(
        'flex-1 h-full',
        'flex flex-col justify-content items-center gap-y-2',
        'bg-white p-6',
        className
      )}
      onSubmit={handleSubmit(handleImportSubmit)}
    >
      <h1 className="text-2xl font-semibold">{t('importWallet')}</h1>
      <p className="text-sm text-center">{t('uploadYourEncryptedWalletFile')}</p>
      {walletFile == null ? (
        <div
          className={classNames(
            'p-10',
            'flex flex-col items-center gap-y-2',
            'border-2 border-dashed border-grey-200 rounded-lg'
          )}
        >
          <Icon name={IconName.UploadFile} size="xxl" />
          <p className="text-sm">Drag and drop file or {uploadFileComponent()}</p>
          <p className="text-sm text-gray-200">.JSON</p>
          <div>
            <input style={{ display: 'none' }} ref={walletFileRef} onChange={onUploadFile} type="file" />
          </div>
        </div>
      ) : (
        <div className={classNames('flex justify-between items-center', 'bg-gray-50 rounded-lg', 'w-full py-6 px-3')}>
          <div className="flex">
            <Icon name={IconName.UploadedFile} size="lg" />
            <div className="flex items-center pl-4">{walletFile.name}</div>
          </div>
          {/* <progress color="blue" value={100} max={100} /> */}
          <button type="button" onClick={handleClear}>
            <Icon name={IconName.CloseCircle} fill="black" size="md" />
          </button>
        </div>
      )}

      {walletFile != null && (
        <div className="flex mt-8 mb-4">
          <FormField
            ref={register({
              required: PASSWORD_ERROR_CAPTION
            })}
            label={t('password')}
            id="newwallet-password"
            type="password"
            name="password"
            placeholder="********"
            // TODO: Determine error caption? Could also be "the import fucked up"-type error
            errorCaption={isWrongPassword ? 'Wrong password' : errors.password?.message}
            onChange={handlePasswordChange}
            containerClassName="mb-4"
          />
        </div>
      )}

      <FormSubmitButton
        loading={formState.isSubmitting}
        className="w-full text-base pt-4 mx-auto"
        style={{ display: 'block', fontWeight: 500, padding: '12px 0px' }}
        disabled={!formState.isValid || !walletFile}
      >
        <T id={'import'} />
      </FormSubmitButton>
    </form>
  );
};
