import React, { FC } from 'react';

import classNames from 'clsx';
import Modal from 'react-modal';

import { isExtension } from 'lib/platform';
import { PropsWithChildren } from 'lib/props-with-children';

export type CustomModalProps = Modal.Props & Partial<PropsWithChildren>;

const CustomModal: FC<CustomModalProps> = props => {
  const { className, overlayClassName, isOpen, ...restProps } = props;

  const rootElement = document.getElementById('root');

  if (!rootElement) {
    return null;
  }

  return (
    <Modal
      id={'custom-modal'}
      {...restProps}
      isOpen={isOpen}
      className={classNames('bg-white rounded z-30 shadow-2xl', className)}
      appElement={rootElement}
      closeTimeoutMS={isExtension() ? 0 : 200}
      overlayClassName={classNames(
        'fixed inset-0 z-30',
        'bg-black bg-opacity-75',
        'flex items-center justify-center',
        'p-6',
        overlayClassName
      )}
      onAfterOpen={() => {
        document.body.classList.add('overscroll-y-none');
      }}
      onAfterClose={() => {
        document.body.classList.remove('overscroll-y-none');
      }}
    />
  );
};

export default CustomModal;
