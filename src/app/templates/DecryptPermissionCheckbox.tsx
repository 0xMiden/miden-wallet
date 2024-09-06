import React, { useState } from 'react';

import classNames from 'clsx';

import FormCheckbox from 'app/atoms/FormCheckbox';
import { T, t } from 'lib/i18n/react';

type DecryptPermissionCheckboxProps = {
  setChecked: (isChecked: boolean) => void;
};

const DecryptPermissionCheckbox: React.FC<DecryptPermissionCheckboxProps> = ({ setChecked }) => {
  const [confirmDecryptionPermission, setConfirmDecryptionPermission] = useState(false);

  const handlePopupModeChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmDecryptionPermission(evt.target.checked);
    setChecked(evt.target.checked);
  };

  return (
    <div className={classNames('w-full', 'mb-4', 'flex flex-col')}>
      <FormCheckbox
        checked={confirmDecryptionPermission}
        onChange={handlePopupModeChange}
        name="confirmDecryptionPermission"
        label={t('confirmRisk')}
        containerClassName="mb-4"
      />
      <label className="mb-4 leading-tight flex flex-col" htmlFor="confirmDecryptionPermission">
        <span className="mt-1 text-xs  text-black" style={{ maxWidth: '90%' }}>
          <T id="confirmDecryptionPermissionDescription" />
        </span>
      </label>
    </div>
  );
};

export default DecryptPermissionCheckbox;
