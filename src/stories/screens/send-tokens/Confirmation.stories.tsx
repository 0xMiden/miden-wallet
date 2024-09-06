import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { ConfirmationScreen } from 'screens/send-tokens/Confirmation';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ConfirmationScreen> = {
  title: 'Screens/Send Tokens/Confirmation',
  component: ConfirmationScreen,
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
type Story = StoryObj<typeof ConfirmationScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {}
};
