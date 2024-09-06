import React, { HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';

import { Button, ButtonVariant } from 'components/Button';

export interface InfoModalScreenProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  onClose?: () => void;
}

export const InfoModalScreen: React.FC<InfoModalScreenProps> = ({
  className,
  title,
  description,
  onClose,
  ...props
}) => {
  const onCloseClick = useCallback(() => onClose?.(), [onClose]);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col justify-end', className)}>
      <button className="flex-1 bg-transparent" onClick={onCloseClick} />
      <div className="flex flex-col bg-white p-4 gap-y-1 z-10">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm font-normal">
          {description}{' '}
          <a
            href="https://help.leo.app/hc/en-us/articles/24084964632852-Private-vs-Public"
            target="_blank"
            className="text-blue-600"
            rel="noreferrer"
          >
            Read more
          </a>
        </p>
        <Button className="mt-3" title={'Close'} variant={ButtonVariant.Secondary} onClick={onCloseClick} />
      </div>
    </div>
  );
};
