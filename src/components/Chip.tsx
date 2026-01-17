import React from 'react';

import classNames from 'clsx';

export interface ChipProps extends React.ComponentProps<'label'> {
  label: string | React.ReactNode;
  selected?: boolean;
  className?: string;
}

const defaultClassName = 'bg-white border border-grey-100 text-black hover:border-grey-200 hover:bg-grey-50';
const selectedClassName = 'bg-black border border-black text-white hover:bg-grey-800';

export const Chip: React.FC<ChipProps> = ({ label, selected, className, ...props }) => {
  const stateClassName = selected ? selectedClassName : defaultClassName;

  return (
    <label
      {...props}
      className={classNames(
        'flex items-center justify-center',
        'px-3 py-2 min-h-8 rounded-full',
        'transition duration-300 ease-in-out',
        'font-base text-sm',
        stateClassName,
        className
      )}
    >
      {label}
    </label>
  );
};
