import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { SelectAmount, SelectAmountProps } from 'screens/send-flow/SelectAmount';
import {
  SendFlowAction,
  SendFlowActionId,
  SendTokensAction,
  SendTokensActionId,
  UITransactionType
} from 'screens/send-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof SelectAmount> = {
  title: 'Screens/Send Flow/Select Amount',
  component: SelectAmount,
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
    const [, updateArgs] = useArgs<SelectAmountProps>();
    const onAction = (action: SendFlowAction) => {
      if (action.id === SendFlowActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <SelectAmount {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof SelectAmount>;
