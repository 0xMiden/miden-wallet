import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { AdvancedOptionsScreen, AdvancedOptionsScreenProps } from 'screens/send-tokens/AdvancedOptions';
import { SendTokensAction, SendTokensActionId, UITransactionType } from 'screens/send-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof AdvancedOptionsScreen> = {
  title: 'Screens/Send Tokens/Advanced Options',
  component: AdvancedOptionsScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name', 'onAction'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    sendType: {
      options: Object.values(UITransactionType),
      control: { type: 'select', defaultValue: UITransactionType.Private },
      defaultValue: UITransactionType.Private
    },
    receiveType: {
      options: Object.values(UITransactionType),
      control: { type: 'select', defaultValue: UITransactionType.Private },
      defaultValue: UITransactionType.Private
    }
  },
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <Story />
    </div>
  ),
  render: function Render(args) {
    const [, updateArgs] = useArgs<AdvancedOptionsScreenProps>();
    const onAction = (action: SendTokensAction) => {
      if (action.id === SendTokensActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <AdvancedOptionsScreen {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof AdvancedOptionsScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    token: {
      id: 'defaultaleotokenid',
      name: 'ALEO',
      publicBalance: 10,
      privateBalance: 1000,
      fiatPrice: 1
    },
    sendType: UITransactionType.Private,
    receiveType: UITransactionType.Private
  }
};
