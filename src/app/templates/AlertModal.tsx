import React, { FC } from 'react';

import { useTranslation } from 'react-i18next';

import FormSubmitButton from 'app/atoms/FormSubmitButton';
import ModalWithTitle, { ModalWithTitleProps } from 'app/templates/ModalWithTitle';

export type AlertModalProps = ModalWithTitleProps;

const AlertModal: FC<AlertModalProps> = props => {
  const { t } = useTranslation();
  const { onRequestClose, children, ...restProps } = props;

  return (
    <ModalWithTitle {...restProps} onRequestClose={onRequestClose}>
      <div className="flex flex-col">
        <div className="mb-8">{children}</div>
        <div className="flex justify-center">
          <FormSubmitButton type="button" className="w-full justify-center" onClick={onRequestClose}>
            {t('ok')}
          </FormSubmitButton>
        </div>
      </div>
    </ModalWithTitle>
  );
};

export default AlertModal;
