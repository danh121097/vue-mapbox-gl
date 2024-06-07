/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier/skip-formatting',
    'plugin:prettier/recommended'
  ],
  plugins: ['@typescript-eslint', 'vue', 'unused-imports'],
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    extraFileExtensions: ['.vue']
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    'unused-imports/no-unused-imports': 'warn'
  }
}
