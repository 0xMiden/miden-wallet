import React, { useState, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from 'app/icons/v2';
import { Button } from 'components/Button';

export interface ImportSeedPhraseScreenProps {
  className?: string;
  onSubmit?: (seedPhrase: string) => void;
}

export const ImportSeedPhraseScreen: React.FC<ImportSeedPhraseScreenProps> = ({ className, onSubmit }) => {
  const { t } = useTranslation();
  const walletFileRef = useRef<HTMLInputElement>(null);
  const [walletFile, setWalletFile] = useState<File | null>(null);

  const handleClear = () => {
    setWalletFile(null);
  };

  const handleSubmit = () => {
    if (walletFile !== null && onSubmit) {
      onSubmit('');
    }
  };

  const onUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files && files.length) {
      const file = files[0];
      const parts = file.name.split('.');
      const size = file.size;
      const fileType = parts[parts.length - 1];
      // TODO error checking if wrong file type
      console.log('fileType', fileType);
      // TODO error checking for fileSize <= 1MB
      setWalletFile(file);
    } else {
      // TODO error checking for 0 or >1 files
    }
  };

  const uploadFileComponent = (): JSX.Element => {
    const style = {
      color: '#0000EE',
      cursor: 'pointer'
    };
    return (
      <span onClick={uploadFileClick} style={style}>
        {t('chooseFromDevice')}
      </span>
    );
  };

  const uploadFileClick = () => {
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
