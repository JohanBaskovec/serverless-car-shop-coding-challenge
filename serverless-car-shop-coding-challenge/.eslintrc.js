module.exports = {
  env: {
    browser: false,
    es2021: true
  },
  extends: 'standard-with-typescript',
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: "./tsconfig.json"
  },
  rules: {
    '@typescript-eslint/consistent-type-assertions': ['error', {
      assertionStyle: 'as',
    }],
    '@typescript-eslint/indent': ['error', 4],
    '@typescript-eslint/space-before-function-paren': ['error', 'never'],
    "@typescript-eslint/semi": ['error', 'always'],
  }
}
