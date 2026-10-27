import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Rules below turn the "code quality" checklist of the project into automatic checks.
export default [
  { ignores: ['.output/', '.wxt/', 'node_modules/', 'scripts/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      // Always use `browser` from 'wxt/browser' (it works in every browser), never `chrome`
      'no-restricted-globals': [
        'error',
        { name: 'chrome', message: "Use `browser` from 'wxt/browser' instead of the chrome global." },
      ],
      // No eval and friends (also forbidden by the extension CSP)
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // Build DOM with el() / textContent, never with HTML strings
      'no-restricted-syntax': [
        'error',
        {
          selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]",
          message: 'Do not assign HTML strings. Use the el() helper or textContent.',
        },
        {
          selector: "CallExpression[callee.property.name='insertAdjacentHTML']",
          message: 'Do not insert HTML strings. Use the el() helper or textContent.',
        },
      ],
    },
  },
];
