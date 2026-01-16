import React, { FC, useEffect } from 'react';

import classNames from 'clsx';
import Modal from 'react-modal';

import { PropsWithChildren } from 'lib/props-with-children';

export type CustomModalProps = Modal.Props & Partial<PropsWithChildren>;

const CustomModal: FC<CustomModalProps> = props => {
  const { className, overlayClassName, isOpen, ...restProps } = props;

  // Debug logging
  useEffect(() => {
    console.log('[CustomModal] isOpen changed to: ' + isOpen);
  }, [isOpen]);

  useEffect(() => {
    console.log('[CustomModal] Component MOUNTED');
    return () => console.log('[CustomModal] Component UNMOUNTED');
  }, []);

  const rootElement = document.getElementById('root');
  console.log('[CustomModal] RENDER isOpen=' + isOpen + ' rootExists=' + !!rootElement);

  if (!rootElement) {
    console.error('[CustomModal] ROOT ELEMENT NOT FOUND!');
    return null;
  }

  return (
    <Modal
      id={'custom-modal'}
      {...restProps}
      isOpen={isOpen}
      className={classNames('bg-white rounded z-30 shadow-2xl', className)}
      appElement={rootElement}
      closeTimeoutMS={200}
      overlayClassName={classNames(
        'fixed inset-0 z-30',
        'bg-black bg-opacity-75',
        'flex items-center justify-center',
        'p-6',
        overlayClassName
      )}
      onAfterOpen={() => {
        console.log('[CustomModal] onAfterOpen called - modal is now visible');
        document.body.classList.add('overscroll-y-none');
      }}
      onAfterClose={() => {
        console.log('[CustomModal] onAfterClose called - modal closed');
        document.body.classList.remove('overscroll-y-none');
      }}
    />
  );
};

export default CustomModal;
