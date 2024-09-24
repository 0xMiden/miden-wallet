import React, { FC } from 'react';
import { Button } from './Button';
import classNames from 'clsx';
import { t } from 'i18next';

type UploadFileButtonProps = {
  uploadFile: () => void;
};

const UploadFileButton: FC<UploadFileButtonProps> = ({ uploadFile }) => {
  return (
    <Button
      className={classNames(
        'relative w-full',
        'rounded-lg border-2',
        'bg-primary-500 border-primary-purple',
        'flex justify-center',
        'font-medium',
        'transition duration-200 ease-in-out',
        'text-white'
      )}
      style={{
        padding: '12px 16px',
        fontSize: '16px',
        lineHeight: '24px'
      }}
      onClick={uploadFile}
      testID="FileSettings/UploadFile"
    >
      {t('uploadFile')}
    </Button>
  );
};

export default UploadFileButton;
