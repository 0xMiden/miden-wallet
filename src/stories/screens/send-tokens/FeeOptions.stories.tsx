import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { FeeOptionsScreen, FeeOptionsScreenProps } from 'screens/send-tokens/FeeOptions';
import { SendTokensAction, SendTokensActionId, UIFeeType, UITransactionType } from 'screens/send-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof FeeOptionsScreen> = {
  title: 'Screens/Send Tokens/Fee Options',
  component: FeeOptionsScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name', 'onAction'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    feeType: {
      options: Object.values(UIFeeType),
      control: { type: 'select', defaultValue: UIFeeType.Private },
      defaultValue: UIFeeType.Private
    }
  },
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <Story />
    </div>
  ),
  render: function Render(args) {
    const [, updateArgs] = useArgs<FeeOptionsScreenProps>();
    const onAction = (action: SendTokensAction) => {
      if (action.id === SendTokensActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <FeeOptionsScreen {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof FeeOptionsScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    aleoBalance: {
      public: 15,
      private: 0
    },
    aleoTokenId: 'defaultaleotokenid',
    fee: '0.025',
    feeType: UIFeeType.Private,
    sendType: UITransactionType.Private,
    receiveType: UITransactionType.Private,
    token: {
      id: 'defaulttokenid',
      name: 'Aleo',
      privateBalance: 10,
      publicBalance: 50,
      fiatPrice: 1
    },
    recommendedFees: {
      ALEO: {
        private: {
          private: '0.01',
          public: '0.02'
        },
        public: {
          private: '0.03',
          public: '0.04'
        }
      },
      OTHER: {
        private: {
          private: '0.05',
          public: '0.06'
        },
        public: {
          private: '0.07',
          public: '0.08'
        }
      }
    }
  }
};
