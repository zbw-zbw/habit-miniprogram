module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  globals: {
    wx: true,
    App: true,
    Page: true,
    Component: true,
    getApp: true,
    getCurrentPages: true,
    Behavior: true,
    module: true,
    getRegExp: true,
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_', 
      varsIgnorePattern: '^_' 
    }],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 
      avoidEscape: true,
      allowTemplateLiterals: true
    }],
  },
  ignorePatterns: [
    'node_modules/',
    'miniprogram_npm/',
    'dist/',
    '*.js',
    '!.eslintrc.js',
    '*.json',
  ],
}; 
