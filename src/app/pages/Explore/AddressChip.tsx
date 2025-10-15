import React, { FC } from 'react';

import classNames from 'clsx';

import HashChip from 'app/templates/HashChip';

type AddressChipProps = {
  publicKey: string;
  className?: string;
  small?: boolean;
  trim?: boolean;
};

const AddressChip: FC<AddressChipProps> = ({ publicKey, className, small, trim }) => {
  return (
    <div className={classNames('flex items-center', className)}>
      <HashChip hash={publicKey} small={small} trimHash={trim} />
    </div>
  );
};

export default AddressChip;
