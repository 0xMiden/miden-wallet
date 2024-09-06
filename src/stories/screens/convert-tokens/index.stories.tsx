import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { IndexScreen } from 'screens/convert-tokens/index';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof IndexScreen> = {
  title: 'Screens/Convert Tokens/Flow',
  component: IndexScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name', 'onAction', 'onSubmitForm', 'onClose', 'chainId'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    onSubmitForm: {
      name: 'submitResponse',
      options: ['success', 'error', 'long-loading'],
      mapping: {
        success: () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve(true);
            }, 2000);
          }),
        error: () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(false);
            }, 2000);
          }),
        'long-loading': () =>
          new Promise(resolve => {
            setTimeout(() => {
              resolve(true);
            }, 5000);
          })
      },
      control: { type: 'select' },
      description: 'The response of the form submission'
    }
  },
  decorators: Story => (
    // <div className="w-[37.5rem] h-[40rem]">
    <Story />
    // </div>
  ),
  render: function Render(args) {
    return <IndexScreen {...args} />;
  }
};

export default meta;
type Story = StoryObj<typeof IndexScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    aleoBalance: {
      private: 20,
      public: 3000
    },
    aleoTokenId: 'defaultaleotokenid',
    records: {
      public: 10,
      private: 10
    },
    chainId: 'testnetbeta',
    accountWallet: 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c',
    token: {
      id: 'ALEO',
      name: 'ALEO',
      privateBalance: 10,
      publicBalance: 1000,
      fiatPrice: 1
    },
    recommendedFees: {
      public: '0.0001',
      private: '0.0002'
    },
    isLoading: false,
    onClose: () => console.log('cancel'),
    onSubmitForm: () =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      })
  }
};
