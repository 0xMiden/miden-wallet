import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { TransactionOptionsScreen, TransactionOptionsScreenProps } from 'screens/convert-tokens/TransactionOptions';
import { ConvertTokensAction, ConvertTokensActionId, UITransactionType } from 'screens/convert-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof TransactionOptionsScreen> = {
  title: 'Screens/Convert Tokens/Transaction Options',
  component: TransactionOptionsScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <Story />
    </div>
  ),
  render: function Render(args) {
    const [, updateArgs] = useArgs<TransactionOptionsScreenProps>();
    const onAction = (action: ConvertTokensAction) => {
      if (action.id === ConvertTokensActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <TransactionOptionsScreen {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof TransactionOptionsScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    records: {
      public: 10,
      private: 20
    },
    aleoTokenId: 'defaultaleotokenid',
    token: {
      id: 'defaultaleotokenid',
      name: 'ALEO',
      publicBalance: 10,
      privateBalance: 1000,
      fiatPrice: 1
    },
    receiveType: UITransactionType.Public,
    sendType: UITransactionType.Public,
    amount: '0',
    feeAmount: '0'
  }
};
