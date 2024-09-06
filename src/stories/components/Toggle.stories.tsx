import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { Toggle, ToggleProps } from 'components/Toggle';

const meta: Meta<typeof Toggle> = {
  title: 'Components/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
    controls: { exclude: ['className', 'onChangeValue'] }
  },
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'boolean' },
    disabled: { control: 'boolean' }
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs<ToggleProps>();
    const onChangeValue = (value: boolean) => updateArgs({ value });
    return <Toggle {...args} onChangeValue={onChangeValue} />;
  }
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Example: Story = {
  args: {
    value: true,
    disabled: false
  }
};
