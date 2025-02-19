import React, { ChangeEvent, FC, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { OnSubmit, useForm } from 'react-hook-form';

import FormField from 'app/atoms/FormField';
import FormSubmitButton from 'app/atoms/FormSubmitButton';
import { t, T } from 'lib/i18n/react';
import { Alert } from 'components/Alert';
import { AlertVariant } from 'components/Alert';
import { TextArea } from 'components/TextArea';

type FormData = {
  fileName: string;
};

export interface ExportFileNameProps {
  onGoNext: () => void;
  onGoBack: () => void;
  onFileNameChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  fileName: string;
}

const DEFAULT_FILE_NAME = 'Encrypted Wallet File.json';

const ExportFileName: React.FC<ExportFileNameProps> = ({ onGoNext, onGoBack, onFileNameChange, fileName }) => {
  const { register, handleSubmit, errors, setError, clearError, formState } = useForm<FormData>();

  return (
    <div className="w-full max-w-sm p-2 mx-auto">
      <Alert
        variant={AlertVariant.Warning}
        title="Do not share your Encrypted Wallet File! If someone has your Encrypted Wallet File and password, they will have full control of your wallet."
      />

      <TextArea placeholder={DEFAULT_FILE_NAME} className="w-full pr-10" value={fileName} onChange={onFileNameChange} />
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

export default ExportFileName;
