import type { Meta, StoryObj } from '@storybook/react';

import { CreatePasswordScreen } from 'screens/onboarding/common/CreatePassword';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof CreatePasswordScreen> = {
  title: 'Screens/Onboarding/CreatePassword',
  component: CreatePasswordScreen,
  parameters: {},
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    name: { control: 'text' },
    value: { name: 'Value', control: 'boolean', defaultValue: true }
  }
};

export default meta;
type Story = StoryObj<typeof CreatePasswordScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {}
};
