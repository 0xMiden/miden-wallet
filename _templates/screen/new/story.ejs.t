---
to: src/stories/screens/<%=flow%>/<%=name%>.stories.tsx
---
import type { Meta, StoryObj } from '@storybook/react';

import { <%=name%>Screen } from 'screens/<%=flow%>/<%=name%>';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof <%=name%>Screen> = {
  title: 'Screens/<%=flow%>/<%=name%>',
  component: <%=name%>Screen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
};

export default meta;
type Story = StoryObj<typeof <%=name%>Screen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {}
};
