import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { IndexScreen } from 'screens/send-tokens/index';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof IndexScreen> = {
  title: 'Screens/Send Tokens/Flow',
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
    aleoRecordCount: 3,
    aleoTokenId: 'defaultaleotokenid',
    recommendedFees: {
      ALEO: {
        private: {
          private: '0.0001',
          public: '0.0002'
        },
        public: {
          private: '0.0003',
          public: '0.0004'
        }
      },
      OTHER: {
        private: {
          private: '0.0005',
          public: '0.0006'
        },
        public: {
          private: '0.0007',
          public: '0.0008'
        }
      }
    },
    chainId: 'testnetbeta',
    contacts: [
      {
        id: 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c',
        name: 'Account 2',
        address: 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c',
        isOwned: true
      },
      {
        id: 'aleo1djj09pnq27927gald6zx2jpdkkkp3hu9e7r7g6qghkq2nyrfkvqss4uvfg',
        name: 'Account 3',
        address: 'aleo1djj09pnq27927gald6zx2jpdkkkp3hu9e7r7g6qghkq2nyrfkvqss4uvfg',
        isOwned: true
      },
      {
        id: 'aleo1fjdfksl3j9fkp3hu9e7r7g6qghkq2nykp3hu9e7r7g6qghkq2nykp3hu9e',
        name: 'Account 3',
        address: 'aleo1fjdfksl3j9fkp3hu9e7r7g6qghkq2nykp3hu9e7r7g6qghkq2nykp3hu9e',
        isOwned: false
      }
    ],
    accountWallet: 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c',
    tokens: [
      {
        id: 'ALEO',
        name: 'ALEO',
        privateBalance: 20,
        publicBalance: 3000,
        fiatPrice: 1
      },
      {
        id: 'OTHER',
        name: 'OTHER',
        privateBalance: 10,
        publicBalance: 10,
        fiatPrice: 0
      },
      {
        id: 'TEST',
        name: 'TEST',
        privateBalance: 1000,
        publicBalance: 500000,
        fiatPrice: 0
      }
    ],
    isLoading: false,
    resolveRecipientAddress: (address?: string): Promise<{ ansName?: string; address: string }> => {
      return Promise.resolve(
        address && address.length > 5
          ? {
              address: address.endsWith('.ans')
                ? 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c'
                : address,
              ansName: address.endsWith('.ans') ? address : undefined
            }
          : {
              address: ''
            }
      );
    },
    onClose: () => console.log('cancel'),
    onSubmitForm: () =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(true);
        }, 2000);
      })
  }
};
