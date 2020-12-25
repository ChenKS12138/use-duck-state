const { getESLintConfig } = require('@iceworks/spec');

// https://www.npmjs.com/package/@iceworks/spec
module.exports = getESLintConfig('rax-ts', {
  extends: ['prettier', 'prettier/@typescript-eslint'],
});
