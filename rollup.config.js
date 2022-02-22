import scss from 'rollup-plugin-scss';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-import-css';
import packageJson from './package.json';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
	external: ['react', 'react-dom', 'boundless-api-client'],
	input: 'src/index.ts',
	plugins: [
		nodeResolve({
			extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.node', '.css'],
		}),
		commonjs(),
		typescript({tsconfig: './tsconfig.json'}),
		scss(),
		css()
	],
	// output: {}
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