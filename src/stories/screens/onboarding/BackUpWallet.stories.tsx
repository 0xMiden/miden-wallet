import type { Meta, StoryObj } from '@storybook/react';

import { BackUpWalletScreen } from 'screens/onboarding/create-wallet-flow/BackUpWallet';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof BackUpWalletScreen> = {
  title: 'Screens/Onboarding/BackUpYourWallet',
  component: BackUpWalletScreen,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    // layout: 'pad',
    controls: { exclude: [] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof BackUpWalletScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    words: ['hello', 'world', 'foo', 'bar', 'baz', 'qux', 'quux', 'corge', 'grault', 'garply', 'waldo', 'fred']
  }
};
