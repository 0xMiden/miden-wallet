import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Eye } from 'app/icons';
import { Input } from 'components/Input';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['name', 'icon', 'containerClassName', 'inputClassName', 'labelClassName', 'iconClassName'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    name: { control: 'text' },
    value: { control: 'text', name: 'Value', defaultValue: 'Hello World!' },
    placeholder: { control: 'text', name: 'Placeholder', defaultValue: 'Enter password' },
    label: { control: 'text', name: 'Label', defaultValue: 'Password' },
    type: {
      name: 'Type',
      options: ['text', 'password', 'email', 'number'],
      control: { type: 'select' },
      defaultValue: 'password'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Input>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    name: 'password',
    value: 'abcd1234',
    label: 'Enter password',
    type: 'password',
    icon: <Eye className="w-6 aspect-square" />
  }
};
