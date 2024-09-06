import React, { useCallback } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { IconName } from 'app/icons/v2';
import { Button, ButtonVariant } from 'components/Button';
import { CircleButton } from 'components/CircleButton';
import { DefaultAnimationConfig, Navigator, NavigatorProvider, Route, useNavigator } from 'components/Navigator';

const ExampleRoutes: Route[] = [
  {
    name: 'First',
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: 'Second',
    animationIn: 'push',
    animationOut: 'pop'
  },
  {
    name: 'Third',
    animationIn: 'present',
    animationOut: 'dismiss'
  },
  {
    name: 'Fourth',
    animationIn: 'push',
    animationOut: 'pop'
  }
];

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Navigator> = {
  title: 'Components/Navigator',
  component: Navigator,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    animationDuration: { control: { type: 'number', min: 0.1, max: 10, step: 0.1 } }
  },
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <NavigatorProvider routes={ExampleRoutes} initialRouteName="First">
        <Story />
      </NavigatorProvider>
    </div>
  ),
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
  render: function Render(args) {
    const { routes, navigate, activeRoute, goBack } = useNavigator();

    const onPressNext = useCallback(() => {
      if (!activeRoute) {
        return;
      }
      const nextRouteIndex = routes.findIndex(route => route.name === activeRoute.name) + 1;

      if (nextRouteIndex < routes.length) {
        navigate(routes[nextRouteIndex]);
      }
    }, [navigate, activeRoute, routes]);

    const renderRoute = useCallback(
      (route: Route, index: number) => {
        return (
          <div className="flex-1 flex flex-col items-center justify-between text-4xl gap-y-8 p-8">
            {index > 0 && (
              <CircleButton
                className="self-start"
                title={route.animationIn === 'present' ? 'Dismiss' : 'Pop'}
                icon={route.animationIn === 'present' ? IconName.CloseCircleFill : IconName.ArrowLeft}
                onClick={() => {
                  console.log(' go back from ', route.name);
                  goBack();
                }}
              />
            )}
            {route.name} screen
            {route.animationIn === 'push' && (
              <Button variant={ButtonVariant.Primary} title={'Next Screen'} onClick={onPressNext} />
            )}
          </div>
        );
      },
      [onPressNext, goBack]
    );

    return <Navigator {...args} renderRoute={renderRoute} />;
  }
};

export default meta;
type Story = StoryObj<typeof Navigator>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    // renderRoute: name => <div className="flex-1 flex items-center justify-center text-4xl bg-gray-50">{name}</div>,
    animationDuration: 0.2,
    animationConfig: DefaultAnimationConfig,
    initialRouteName: 'First'
  }
};
