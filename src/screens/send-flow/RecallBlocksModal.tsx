import React, { FC } from 'react';

import classNames from 'clsx';
import { t } from 'i18next';
import Modal from 'react-modal';

import { Button, ButtonVariant } from 'components/Button';
import { Input } from 'components/Input';

export interface RecallBlocksModalProps extends Modal.Props {
  recallBlocksInput?: string;
  onBlocksChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export const RecallBlocksModal: FC<RecallBlocksModalProps> = ({
  recallBlocksInput,
  onBlocksChangeHandler,
  onCancel,
  onSubmit,
  ...restProps
}) => {
  return (
    <Modal
      id={'recall-height-modal'}
      {...restProps}
      className={classNames('w-full bg-white px-4 py-6 md:rounded-b z-30 shadow-2xl')}
      appElement={document.getElementById('root')!}
      closeTimeoutMS={200}
      overlayClassName={classNames('absolute inset-0 z-30', 'bg-black bg-opacity-75', 'flex items-end justify-center')}
      onAfterOpen={() => {
        document.body.classList.add('overscroll-y-none');
      }}
      onAfterClose={() => {
        document.body.classList.remove('overscroll-y-none');
      }}
    >
      <div className="text-black text-left">
        <h1 className={classNames('mb-2 text-lg font-medium')}>Recall blocks</h1>
        <p className="text-[#656565] text-xs">
          If the recipient does not accept the transaction before the specified number of blocks have passed, you will
          be able to recall your funds.
        </p>
        <div className="my-4">
          <Input
            label="Blocks until recall"
            autoFocus={true}
            value={recallBlocksInput}
            onChange={onBlocksChangeHandler}
          />
        </div>
        <div className="flex flex-row gap-x-2">
          <Button className="flex-1" title={t('cancel')} variant={ButtonVariant.Secondary} onClick={onCancel} />
          <Button
            className="flex-1"
            title={t('add')}
            variant={ButtonVariant.Primary}
            disabled={false}
            onClick={onSubmit}
          />
        </div>
      </div>
    </Modal>
  );
};
