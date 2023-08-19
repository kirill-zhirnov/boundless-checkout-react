import scss from 'rollup-plugin-scss';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-import-css';
import packageJson from './package.json';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import {babel} from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default {
	external: ['boundless-api-client', 'react', 'react-dom'],
	input: 'src/index.ts',
	plugins: [
		json(),
		nodeResolve({
			extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.node', '.css'],
		}),
		commonjs(),
		typescript({
			tsconfig: './tsconfig.json',
			exclude: ['./src/dev/**.*']
		}),
		babel({
			babelHelpers: 'bundled',
			exclude: 'node_modules/**',
		}),
		scss({fileName: 'index.css'}),
		css(),
		terser()
	],
	output: [
		{
			file: packageJson.main,
			format: 'cjs',
			sourcemap: true,
		},
		{
			file: packageJson.module,
			format: 'esm',
			sourcemap: true,
		},
	]
};