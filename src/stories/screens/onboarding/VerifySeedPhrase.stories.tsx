import type { Meta, StoryObj } from '@storybook/react';

import { VerifySeedPhraseScreen } from 'screens/onboarding/create-wallet-flow/VerifySeedPhrase';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof VerifySeedPhraseScreen> = {
  title: 'Screens/Onboarding/VerifySeedPhrase',
  component: VerifySeedPhraseScreen,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    // layout: 'padded',
    controls: { exclude: [] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof VerifySeedPhraseScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    words: ['hello', 'world', 'foo', 'bar', 'baz', 'qux', 'quux', 'corge', 'grault', 'garply', 'waldo', 'fred']
  }
};
