import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import svelteParser from 'svelte-eslint-parser';

export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: {
				// Browser globals
				window: 'readonly',
				document: 'readonly',
				console: 'readonly',
				fetch: 'readonly',
				// Node globals for build scripts
				process: 'readonly',
				__dirname: 'readonly',
				__filename: 'readonly',
				global: 'readonly',
				Buffer: 'readonly'
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parser: svelteParser,
			parserOptions: {
				parser: ts.parser,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			// Svelte 5 specific rules
			'svelte/valid-compile': 'error',

			// Code quality rules
			'svelte/no-unused-svelte-ignore': 'warn',
			'svelte/prefer-class-directive': 'warn',
			'svelte/shorthand-attribute': 'warn',
			'svelte/shorthand-directive': 'warn'
		}
	},
	{
		files: ['**/*.ts', '**/*.js'],
		rules: {
			// TypeScript specific rules
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-explicit-any': 'warn'
		}
	},
	{
		// Ignore build outputs and dependencies
		ignores: [
			'build/',
			'.svelte-kit/',
			'dist/',
			'node_modules/',
			'migrations/',
			'*.config.js',
			'*.config.ts'
		]
	}
];