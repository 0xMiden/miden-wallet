import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-webpack5-compiler-swc',
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/addon-interactions',
    '@storybook/addon-mdx-gfm',
    '@storybook/addon-styling-webpack',
    '@storybook/addon-actions/register',
    {
      name: '@newhighsco/storybook-addon-svgr',
      options: {
        svgrOptions: {
          /* config options here */
        }
      }
    }
  ],
  staticDirs: [{ from: '../public', to: '/' }],
  framework: {
    name: '@storybook/react-webpack5',
    options: {}
  },
  docs: {
    autodocs: true
  },
  webpackFinal: async (config, { configType }) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        components: path.resolve(__dirname, '../src/components'),
        screens: path.resolve(__dirname, '../src/screens'),
        app: path.resolve(__dirname, '../src/app'),
        utils: path.resolve(__dirname, '../src/utils'),
        lib: path.resolve(__dirname, '../src/lib')
      };
    }

    config.module?.rules?.push({
      test: /\.css$/,
      use: [
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [require('tailwindcss')]
            }
          }
        }
      ],
      include: path.resolve(__dirname, '../') // path to project root
    });
    return {
      ...config
    };
  }
};
export default config;
