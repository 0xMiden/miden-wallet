import React, { forwardRef, useMemo } from 'react';

import classNames from 'clsx';
import ICurrencyInput, { CurrencyInputProps as ICurrencyInputProps } from 'react-currency-input-field';

type Props = {
  label?: string;
  prefix?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  iconClassName?: string;
  isError?: boolean;
  id?: string;
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, Props {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { id, label, prefix, icon, containerClassName, inputClassName, labelClassName, iconClassName, isError, ...props },
    ref
  ) => {
    const borderClassName = useMemo(() => {
      if (isError) {
        return 'border-red-500 hover:border-red-600 focus:border-red-500';
      }
      return 'border-grey-200 hover:border-grey-300 has-[:focus]:border-primary-500';
    }, [isError]);

    return (
      <div className={classNames('flex flex-col gap-2', containerClassName)}>
        {label && <label className={classNames('text-sm font-medium', labelClassName)}>{label}</label>}
        <div
          className={classNames(
            'flex flex-row items-center',
            'transition duration-300 ease-in-out',
            'overflow-hidden',
            'border rounded-lg',
            borderClassName
          )}
        >
          {prefix && <div className="flex text-gray-400 ml-4 text-base">{prefix}</div>}
          <input
            id={id}
            ref={ref}
            className={classNames(
              'flex-1',
              'pr-2 py-3',
              'placeholder-grey-400',
              'text-base',
              'outline-none',

              prefix ? 'pl-2' : 'pl-4',
              // 'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              inputClassName
            )}
            {...props}
          />
          {icon && (
            <div className={classNames('flex items-center justify-center', 'py-2 pr-2', iconClassName)}>{icon}</div>
          )}
        </div>
      </div>
    );
  }
);

type CurrencyInputProps = ICurrencyInputProps & Props;

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  icon,
  containerClassName,
  inputClassName,
  labelClassName,
  iconClassName,
  ...props
}) => {
  return (
    <div className={classNames('flex flex-col gap-2', containerClassName)}>
      {label && <label className={classNames('text-sm font-medium', labelClassName)}>{label}</label>}
      <div
        className={classNames(
          'flex flex-row items-center',
          'transition duration-300 ease-in-out',
          'overflow-hidden',
          'border border-grey-200 hover:border-grey-300 rounded-lg',
          'has-[:focus]:outline-none has-[:focus]:border-primary-500 has-[:focus]:ring-1 has-[:focus]:ring-primary-500'
        )}
      >
        <ICurrencyInput
          className={classNames(
            'flex-1',
            'pl-4 pr-2 py-3',
            'placeholder-grey-400',
            'text-base',
            'outline-none',
            // 'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
            inputClassName
          )}
          {...props}
        />
        {icon && (
          <div className={classNames('flex items-center justify-center', 'py-2 pr-2', iconClassName)}>{icon}</div>
        )}
      </div>
    </div>
  );
};
