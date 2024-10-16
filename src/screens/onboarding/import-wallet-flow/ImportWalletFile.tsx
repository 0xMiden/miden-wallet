import React, { useState, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button } from 'components/Button';
import { ONE_MB_IN_BYTES } from 'utils/crypto';

interface WalletFile {
  name: string;
  bytes: Uint8Array;
}

export interface ImportWalletFileScreenProps {
  className?: string;
  onSubmit?: (walletFileBytes: Uint8Array) => void;
}

export const ImportWalletFileScreen: React.FC<ImportWalletFileScreenProps> = ({ className, onSubmit }) => {
  const { t } = useTranslation();
  const walletFileRef = useRef<HTMLInputElement>(null);
  const [walletFile, setWalletFile] = useState<WalletFile | null>(null);

  const handleClear = () => {
    setWalletFile(null);
  };

  const handleSubmit = () => {
    if (walletFile !== null && onSubmit) {
      onSubmit(walletFile.bytes);
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

      if (file.size > ONE_MB_IN_BYTES || fileType !== 'json') {
        alert('File size must be <= 1mb and file type must be .json');
        return;
      }

      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const byteArray = new Uint8Array(arrayBuffer);
        setWalletFile({ name: file.name, bytes: byteArray });
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
    <div
      className={classNames(
        'flex-1 h-full',
        'flex flex-col justify-content items-center gap-y-2',
        'bg-white p-6',
        className
      )}
    >
      <h1 className="text-2xl font-semibold">{t('importWallet')}</h1>
      <p className="text-sm">{t('uploadYourEncryptedWalletFile')}</p>

      {walletFile == null ? (
        <div
          className={classNames(
            'w-full h-full py-4',
            'flex flex-col items-center gap-y-2',
            'border-2 border-dashed border-grey-200 rounded-lg'
          )}
        >
          <Icon name={IconName.UploadFile} size="xxl" />
          <p className="text-sm">Drag and drop file or {uploadFileComponent()}</p>
          <p className="text-sm text-gray-200">.JSON, .CSV max 1 MB</p>
          <div>
            <input style={{ display: 'none' }} ref={walletFileRef} onChange={onUploadFile} type="file" />
          </div>
        </div>
      ) : (
        <div className={classNames('flex justify-between items-center', 'bg-gray-50 rounded-lg', 'w-full py-6 px-3')}>
          <div className="flex">
            <Icon name={IconName.UploadedFile} size="lg" />
            <div>{walletFile.name}</div>
          </div>
          <progress color="blue" value={100} max={100} />
          <button type="button" onClick={handleClear}>
            <Icon name={IconName.CloseCircle} fill="black" size="md" />
          </button>
        </div>
      )}

      <Button title={t('continue')} onClick={handleSubmit} disabled={walletFile == null} className="w-[360px]" />
    </div>
  );
};
