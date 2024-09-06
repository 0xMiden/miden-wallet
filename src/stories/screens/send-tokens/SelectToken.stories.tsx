import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { SelectTokenScreen } from 'screens/send-tokens/SelectToken';

const meta: Meta<typeof SelectTokenScreen> = {
  title: 'Screens/Send Tokens/Choose Token',
  component: SelectTokenScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name', 'onAction'] }
  },
  tags: ['autodocs'],
  argTypes: {},
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <Story />
    </div>
  )
};

export default meta;
type Story = StoryObj<typeof SelectTokenScreen>;

export const Example: Story = {
  args: {
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
    ]
  }
};
