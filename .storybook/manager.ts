import { addons } from '@storybook/manager-api';
import { create, themes } from '@storybook/theming';

const theme = create({
  base: 'dark',
  brandTitle: 'Leo App Storybook',
  brandUrl: 'https://www.demoxlabs.xyz/',
  brandImage: 'misc/logo-white-bg-40.png',
  brandTarget: '_self'
});

addons.setConfig({
  theme
});
