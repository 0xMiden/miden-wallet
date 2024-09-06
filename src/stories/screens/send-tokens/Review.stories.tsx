import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { ReviewScreen, ReviewScreenProps } from 'screens/send-tokens/Review';
import { UITransactionType, SendTokensAction, SendTokensActionId, UIFeeType } from 'screens/send-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ReviewScreen> = {
  title: 'Screens/Send Tokens/Review',
  component: ReviewScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name', 'onAction'] }
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
    const [, updateArgs] = useArgs<ReviewScreenProps>();
    const onAction = (action: SendTokensAction) => {
      if (action.id === SendTokensActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <ReviewScreen {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof ReviewScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    amount: '20',
    token: {
      id: 'defaultaleotokenid',
      name: 'ALEO',
      publicBalance: 10,
      privateBalance: 1000,
      fiatPrice: 1
    },
    feeAmount: '0.025',
    sendType: UITransactionType.Private,
    receiveType: UITransactionType.Private,
    feeType: UIFeeType.Private,
    sendAddress: 'aleo1djj09pnq27927gald6zx2jpdkkkp3hu9e7r7g6qghkq2nyrfkvqss4uvfg',
    recipientAddress: 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c',
    isLoading: false,
    isValid: true,
    error: undefined,
    ansName: 'foobar.ans'
  }
};
