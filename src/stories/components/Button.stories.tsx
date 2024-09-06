import type { Meta, StoryObj } from '@storybook/react';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    variant: {
      options: Object.values(ButtonVariant),
      control: { type: 'select', defaultValue: ButtonVariant.Primary },
      defaultValue: ButtonVariant.Primary
    },
    title: { control: 'text', defaultValue: 'Press me!' },
    iconLeft: {
      options: Object.values(IconName),
      control: {
        type: 'select'
      }
    },
    iconRight: {
      options: Object.values(IconName),
      control: {
        type: 'select'
      }
    }
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {}
};

export default meta;
type Story = StoryObj<typeof Button>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    variant: ButtonVariant.Primary,
    title: 'Press me!',
    iconLeft: IconName.AddCircle
  }
};
