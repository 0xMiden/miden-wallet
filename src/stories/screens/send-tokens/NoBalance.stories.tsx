import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { NoBalanceScreen } from 'screens/send-tokens/NoBalance';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof NoBalanceScreen> = {
  title: 'Screens/Send Tokens/No Balance',
  component: NoBalanceScreen,
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
  )
};

export default meta;
type Story = StoryObj<typeof NoBalanceScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {}
};
