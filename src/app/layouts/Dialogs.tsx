import React, { FC, useCallback } from 'react';

import AlertModal from 'app/templates/AlertModal';
import ConfirmationModal from 'app/templates/ConfirmationModal';
import { useMobileBackHandler } from 'lib/mobile/useMobileBackHandler';
import { dispatchAlertClose, dispatchConfirmClose, useModalsParams } from 'lib/ui/dialog';

const Dialogs: FC = () => {
  const { alertParams, confirmParams } = useModalsParams();

  const handleConfirmationModalClose = useCallback(() => {
    dispatchConfirmClose(false);
  }, []);

  const handleConfirmation = useCallback(() => {
    dispatchConfirmClose(true);
  }, []);

  // Handle mobile back button/gesture to close dialogs
  useMobileBackHandler(() => {
    if (confirmParams.isOpen) {
      dispatchConfirmClose(false);
      return true;
    }
    if (alertParams.isOpen) {
      dispatchAlertClose();
      return true;
    }
    return false;
  }, [confirmParams.isOpen, alertParams.isOpen]);

  return (
    <>
      <ConfirmationModal
        {...confirmParams}
        onRequestClose={handleConfirmationModalClose}
        onConfirm={handleConfirmation}
      />
      <AlertModal {...alertParams} onRequestClose={dispatchAlertClose} />
    </>
  );
};

export default Dialogs;
