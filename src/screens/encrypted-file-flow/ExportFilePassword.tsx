import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { T } from 'lib/i18n/react';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

export interface ExportFilePasswordProps {
  onGoNext: () => void;
  onGoBack: () => void;
}

const ExportFilePassword: React.FC<ExportFilePasswordProps> = ({ onGoBack, onGoNext }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <div className="flex flex-col items-center">
        <p className="text-sm text-center font-normal mt-2 w-[500px]">{t('encryptedWalletFilePassword')}</p>
      </div>

      <T id="continue">
        {message => (
          <FormSubmitButton
            className="capitalize w-full justify-center mt-6"
            //   loading={submitting}
            style={{
              fontSize: '18px',
              lineHeight: '24px',
              paddingLeft: '0.5rem',
              paddingRight: '0.5rem',
              paddingTop: '12px',
              paddingBottom: '12px'
            }}
            onClick={onGoNext}
          >
            {message}
          </FormSubmitButton>
        )}
      </T>
    </div>
  );
};

export default ExportFilePassword;
