const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const webpack = require('webpack');
const WebpackBar = require('webpackbar');

const pkg = require('./package.json');
const htmlTemplatesPlugins = require('./webpack.html.config');
const publicAssetsPlugin = require('./webpack.public.config');

const { TARGET_BROWSER = 'chrome' } = process.env;

const MANIFEST = process.env.MANIFEST_VERSION === '3' ? 'manifest.json' : 'manifest.v2.json';

const DIST_PATH = path.join(__dirname, 'dist');
const PUBLIC_PATH = path.join(__dirname, 'public');

const OUTPUT_PATH = path.join(DIST_PATH, `${TARGET_BROWSER}_unpacked`);

const fileFormat = '[name].[hash][ext]';

const appConfig = {
  mode: process.env.MODE_ENV,
  devtool: process.env.MODE_ENV === 'production' ? false : 'source-map',
  cache: {
    type: 'filesystem',
    allowCollectingMemory: true
  },
  performance: {
    hints: false
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    topLevelAwait: true
  },
  entry: {
    confirm: './src/confirm.tsx',
    fullpage: './src/fullpage.tsx',
    options: './src/options.tsx',
    popup: './src/popup.tsx',
    background: './src/background.ts',
    contentScript: './src/contentScript.ts',
    addToWindow: './src/addToWindow.ts'
  },
  devServer: {
    hot: true
  },
  output: {
    pathinfo: false,
    path: OUTPUT_PATH,
    assetModuleFilename: `static/media/${fileFormat}`,
    chunkLoading: 'import-scripts',
    chunkFormat: 'array-push'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.wasm'],
    alias: {
      lib: path.resolve(__dirname, 'src', 'lib'),
      app: path.resolve(__dirname, 'src', 'app'),
      shared: path.resolve(__dirname, 'src', 'shared'),
      stories: path.resolve(__dirname, 'src', 'stories'),
      components: path.resolve(__dirname, 'src', 'components'),
      screens: path.resolve(__dirname, 'src', 'screens'),
      utils: path.resolve(__dirname, 'src', 'utils')
    },
    fallback: {
      url: false,
      os: false,
      path: false,
      crypto: false,
      http: false,
      https: false,
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert')
    }
  },
  optimization: {
    minimizer: [
      `...`, // webpack@5 syntax to extend existing minimizers
      new CssMinimizerPlugin()
    ]
  },
  plugins: [
    new Dotenv(),
    new webpack.EnvironmentPlugin({
      VERSION: pkg.version
    }),

    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),

    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),

    new MiniCssExtractPlugin({
      filename: 'static/styles/[name].css',
      chunkFilename: 'static/styles/[name].chunk.css'
    }),
    new ForkTsCheckerWebpackPlugin(),
    ...htmlTemplatesPlugins(PUBLIC_PATH),
    new ESLintPlugin({
      extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
      cache: true,
      resolvePluginsRelativeTo: __dirname,
      formatter: require.resolve('react-dev-utils/eslintFormatter')
    }),

    publicAssetsPlugin(PUBLIC_PATH, OUTPUT_PATH, MANIFEST, TARGET_BROWSER),

    new WebpackBar({
      name: 'Miden Wallet',
      color: '#634CFF'
    })
  ],
  module: {
    rules: [
      {
        test: /\.(woff|woff2)$/i,
        type: 'asset/resource',
        generator: {
          filename: `static/fonts/${fileFormat}`
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: `static/media/${fileFormat}`
        }
      },
      {
        test: /\.module\.css$/i,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                getLocalIdent: getCSSModuleLocalIdent
              }
            }
          },
          'postcss-loader'
        ]
      },
      {
        test: /\.css$/i,
        exclude: /\.module\.css$/i,
        sideEffects: true,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          'postcss-loader'
        ]
      },
      {
        test: /\.svg$/i,
        issuer: /\.tsx?$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: {
                plugins: [{ removeViewBox: false }]
              },
              titleProp: true,
              ref: true
            }
          },
          {
            loader: 'file-loader',
            options: {
              name: 'static/media/[name].[hash].[ext]'
            }
          }
        ]
      },
      {
        test: /\.m?js$/i,
        exclude: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.tsx?$/i,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            customize: require.resolve('babel-preset-react-app/webpack-overrides')
          }
        }
      }
    ]
  }
};

const workerConfig = {
  mode: process.env.NODE_ENV,
  devtool: process.env.MODE_ENV === 'development' ? 'inline-source-map' : false,
  cache: {
    type: 'filesystem',
    allowCollectingMemory: true
  },
  performance: {
    hints: false
  },
  experiments: {
    asyncWebAssembly: true,
    syncWebAssembly: true,
    topLevelAwait: true
  },
  target: 'webworker',
  entry: {
    consumeNoteId: './src/workers/consumeNoteId.ts',
    sendTransaction: './src/workers/sendTransaction.ts',
    submitTransactionRequest: './src/workers/submitTransactionRequest.ts'
  },
  output: {
    pathinfo: false,
    path: OUTPUT_PATH
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.wasm'],
    alias: {
      shared: path.resolve(__dirname, 'src', 'shared')
    },
    fallback: {
      url: false,
      os: false,
      path: false,
      crypto: false,
      http: false,
      https: false,
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify'),
      assert: require.resolve('assert')
    }
  },
  plugins: [
    new Dotenv(),
    new webpack.EnvironmentPlugin({
      VERSION: pkg.version
    }),

    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),

    new webpack.ProvidePlugin({
      process: 'process/browser'
    }),

    new MiniCssExtractPlugin({
      filename: 'static/styles/[name].css',
      chunkFilename: 'static/styles/[name].chunk.css'
    }),

    new WebpackBar({
      name: 'Miden Wallet Workers',
      color: '#634CFF'
    })
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/i,
        exclude: /node_modules/,
        type: 'javascript/auto'
      },
      {
        test: /\.tsx?$/i,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            customize: require.resolve('babel-preset-react-app/webpack-overrides')
          }
        }
      }
    ]
  }
};

module.exports = [appConfig, workerConfig];
