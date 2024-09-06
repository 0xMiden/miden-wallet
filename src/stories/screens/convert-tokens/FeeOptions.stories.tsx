import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { FeeOptionsScreen, FeeOptionsScreenProps } from 'screens/convert-tokens/FeeOptions';
import { ConvertTokensAction, ConvertTokensActionId, UIFeeType } from 'screens/convert-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof FeeOptionsScreen> = {
  title: 'Screens/Convert Tokens/Fee Options',
  component: FeeOptionsScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name', 'onAction'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    feeType: {
      options: Object.values(UIFeeType),
      control: { type: 'select', defaultValue: UIFeeType.Private },
      defaultValue: UIFeeType.Private
    }
  },
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <Story />
    </div>
  ),
  render: function Render(args) {
    const [, updateArgs] = useArgs<FeeOptionsScreenProps>();
    const onAction = (action: ConvertTokensAction) => {
      if (action.id === ConvertTokensActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <FeeOptionsScreen {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof FeeOptionsScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    fee: '0.025',
    feeType: UIFeeType.Private,
    recommendedFee: '0.025',
    aleoBalance: {
      public: 15,
      private: 0
    }
  }
};
