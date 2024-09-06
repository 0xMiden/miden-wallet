import type { Meta, StoryObj } from '@storybook/react';

import { AmountLabel } from 'components/AmountLabel';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof AmountLabel> = {
  title: 'Components/Amount Label',
  component: AmountLabel,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className', 'name'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof AmountLabel>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    amount: '3.14543566',
    currency: '$'
  }
};
