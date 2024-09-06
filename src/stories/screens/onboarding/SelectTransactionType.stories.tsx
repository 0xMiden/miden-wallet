import type { Meta, StoryObj } from '@storybook/react';

import { SelectTransactionTypeScreen } from 'screens/onboarding/create-wallet-flow/SelectTransactionType';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof SelectTransactionTypeScreen> = {
  title: 'Screens/Onboarding/SelectTransactionType',
  component: SelectTransactionTypeScreen,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof SelectTransactionTypeScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {}
};
