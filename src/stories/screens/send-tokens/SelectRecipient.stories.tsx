import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { SelectRecipientScreen, SelectRecipientScreenProps } from 'screens/send-tokens/SelectRecipient';
import { SendTokensAction, SendTokensActionId } from 'screens/send-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof SelectRecipientScreen> = {
  title: 'Screens/Send Tokens/Choose Recipient',
  component: SelectRecipientScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <Story />
    </div>
  ),
  render: function Render(args) {
    const [, updateArgs] = useArgs<SelectRecipientScreenProps>();
    const onAction = (action: SendTokensAction) => {
      if (action.id === SendTokensActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <SelectRecipientScreen {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof SelectRecipientScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    aleoRecordCount: 10,
    aleoBalance: {
      public: 10,
      private: 1000
    },
    token: {
      id: 'defaultaleotokenid',
      name: 'ALEO',
      publicBalance: 10,
      privateBalance: 1000,
      fiatPrice: 1
    },
    aleoTokenId: 'defaultaleotokenid',
    isValid: true
  }
};
