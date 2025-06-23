import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { ConnectivityIssueBanner } from 'components/ConnectivityIssueBanner';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ConnectivityIssueBanner> = {
  title: 'Components/Sync Banner',
  component: ConnectivityIssueBanner,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className', 'name'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  decorators: [
    Story => (
      <div className="w-96">
        {/* 👇 Decorators in Storybook also accept a function. Replace <Story/> with Story() to enable it  */}
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof ConnectivityIssueBanner>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    progress: 54,
    isFullScreen: false
  }
};
