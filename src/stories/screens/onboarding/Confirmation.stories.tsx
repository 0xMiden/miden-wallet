import type { Meta, StoryObj } from '@storybook/react';

import { ConfirmationScreen } from 'screens/onboarding/common/Confirmation';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ConfirmationScreen> = {
  title: 'Screens/Onboarding/Confirmation',
  component: ConfirmationScreen,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    isLoading: { control: 'boolean' }
  }
};

export default meta;
type Story = StoryObj<typeof ConfirmationScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    isLoading: false
  }
};
