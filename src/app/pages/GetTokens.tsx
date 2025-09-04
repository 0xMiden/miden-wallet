import React, { HTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';

import { IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button, ButtonVariant } from 'components/Button';
import { Message } from 'components/Message';
import { navigate } from 'lib/woozie';

export interface GetTokensProps extends HTMLAttributes<HTMLDivElement> {}

export const GetTokens: React.FC<GetTokensProps> = ({ className, ...props }) => {
  const onFaucetClick = useCallback(() => {
    window.open('https://faucet.testnet.miden.io', '_blank');
  }, []);

  const onTransferClick = useCallback(() => {
    navigate('/receive');
  }, []);

  return (
    <PageLayout
      pageTitle={
        <>
          <span>Add tokens</span>
        </>
      }
      hasBackAction={true}
    >
      <div {...props} className={classNames('flex-1 flex flex-col', className)}>
        <div className="flex-1 flex flex-col justify-center bg-white p-4 md:w-[460px] md:mx-auto">
          <Message
            className="flex-1"
            title="Get tokens"
            description="You can get tokens from the faucet or transfer them from another wallet or account."
            icon={IconName.Tokens}
            iconSize="3xl"
            iconClassName="mb-8"
          />
        </div>
        <div className="p-4 flex flex-col gap-y-4">
          <Button title={'Faucet'} onClick={onFaucetClick} />
          <Button title={'Transfer tokens'} variant={ButtonVariant.Secondary} onClick={onTransferClick} />
        </div>
      </div>
    </PageLayout>
  );
};
