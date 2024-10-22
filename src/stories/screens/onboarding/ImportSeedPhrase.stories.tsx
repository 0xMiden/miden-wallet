import type { Meta, StoryObj } from '@storybook/react';

import { ImportWalletFileScreen } from 'screens/onboarding/import-wallet-flow/ImportWalletFile';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ImportWalletFileScreen> = {
  title: 'Screens/Onboarding/ImportSeedPhrase',
  component: ImportWalletFileScreen,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof ImportWalletFileScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {}
};
