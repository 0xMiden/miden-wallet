import type { Meta, StoryObj } from '@storybook/react';

import { NavigationHeader } from 'components/NavigationHeader';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof NavigationHeader> = {
  title: 'Components/Navigation Header',
  component: NavigationHeader,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className', 'name'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    mode: {
      options: ['back', 'close', 'menu'],
      control: { type: 'select', defaultValue: 'back' },
      defaultValue: 'back'
    }
  }
};

export default meta;
type Story = StoryObj<typeof NavigationHeader>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    mode: 'back',
    title: 'Choose Token'
  }
};
