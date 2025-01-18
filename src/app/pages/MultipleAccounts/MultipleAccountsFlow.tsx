import React, { FC, useEffect } from 'react';

import { useMultipleAccountsStore } from './MultipleAccountsStore';

const MultipleAccountsFlow: FC = () => {
  const { step, direction, fetchAccounts, setStep } = useMultipleAccountsStore();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const renderStep = (): React.ReactNode => {
    switch (step) {
      case AddAccountStep.AccountList:
        return <AccountList />;
      case AddAccountStep.SelectAccountType:
        return <SelectAccountType />;
      case AddAccountStep.CreateSeedPhrase:
        return <CreateSeedPhrase />;
      case AddAccountStep.VerifySeedPhrase:
        return <VerifySeedPhrase />;
      default:
        return null;
    }
  };
};
