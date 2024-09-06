import type { Meta, StoryObj } from '@storybook/react';

import { RadioButton } from 'components/RadioButton';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof RadioButton> = {
  title: 'Components/Radio Button',
  component: RadioButton,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    name: { control: 'text' },
    value: { name: 'Value', control: 'boolean', defaultValue: true }
  }
};

export default meta;
type Story = StoryObj<typeof RadioButton>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    name: 'radio',
    value: true
  }
};
