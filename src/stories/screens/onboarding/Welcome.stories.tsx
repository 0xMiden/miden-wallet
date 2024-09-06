import type { Meta, StoryObj } from '@storybook/react';

import { WelcomeScreen } from 'screens/onboarding/common/Welcome';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof WelcomeScreen> = {
  title: 'Screens/Onboarding/Welcome',
  component: WelcomeScreen,

  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof WelcomeScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {}
};
