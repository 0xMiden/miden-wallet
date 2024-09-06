import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Alert, AlertVariant } from 'components/Alert';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      name: 'Variant',
      options: Object.values(AlertVariant),
      control: { type: 'select' },
      defaultValue: AlertVariant.Info,
      description: 'Unique styling identification'
    },
    title: { control: 'text', name: 'Title', defaultValue: 'Hello World!' },
    canDismiss: { name: 'Can Dismiss', control: 'boolean', defaultValue: false }
  }
};

export default meta;
type Story = StoryObj<typeof Alert>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Information: Story = {
  args: {
    variant: AlertVariant.Info,
    title: 'Additional text – make it as clear as possible.'
  }
};

export const Success: Story = {
  args: {
    variant: AlertVariant.Success,
    title: 'Additional text – make it as clear as possible.'
  }
};

export const Warning: Story = {
  args: {
    variant: AlertVariant.Warning,
    title: 'Additional text – make it as clear as possible.'
  }
};

export const Error: Story = {
  args: {
    variant: AlertVariant.Error,
    title: (
      <span>
        TestNet is down. <span className="text-blue-500">Check status</span>
      </span>
    )
  }
};
