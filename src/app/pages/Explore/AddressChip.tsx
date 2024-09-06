import React, { FC } from 'react';

import classNames from 'clsx';

import HashChip from 'app/templates/HashChip';

type AddressChipProps = {
  publicKey: string;
  className?: string;
  small?: boolean;
};

const AddressChip: FC<AddressChipProps> = ({ publicKey, className, small }) => {
  return (
    <div className={classNames('flex items-center', className)}>
      <HashChip hash={publicKey} small={small} />
    </div>
  );
};

export default AddressChip;
