import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { HomeScreen } from 'screens/home';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof HomeScreen> = {
  title: 'Screens/Home',
  component: HomeScreen,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  decorators: [
    Story => {
      return (
        <div className="flex h-full justify-center overflow-hidden items-center bg-[#BFBFDF]">
          <div className="flex rounded-xl overflow-hidden w-[600px] h-[860px]">
            <Story />
          </div>
        </div>
      );
    }
  ]
};

export default meta;
type Story = StoryObj<typeof HomeScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    syncing: true,
    syncProgress: 50,
    accountAddress: 'aleo14r...u2s2',
    accountName: 'Account 1',
    isFullScreen: true
  }
};
