/*
 * For a detailed explanation regarding each configuration property and type check, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^lib/(.*)$': '<rootDir>/src/lib/$1',
    '^shared/(.*)$': '<rootDir>/src/shared/$1',
    '@demox-labs/aleo-sdk': '<rootDir>/__mocks__/wasmMock.js'
  },
  testEnvironment: 'jsdom',
  transform: {
    '.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js'],
  setupFiles: ['dotenv/config', '@serh11p/jest-webextension-mock', 'fake-indexeddb/auto'],
  setupFilesAfterEnv: ['./jest.setup.js']
};
