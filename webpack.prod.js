const path = require('path');

module.exports = {
	entry: ['./src/index.ts', './src/BoundlessCheckout.tsx', './src/BoundlessOrderInfo.tsx'],
	mode: 'production',
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.json']
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		library: {
			name: 'MyLibrary',
			type: 'commonjs',
		},
		filename: '[name].js',
		libraryTarget: 'commonjs',
		// this to support both browser and Node.
		// https://github.com/riversun/making-library-with-webpack#1-4publish-an-export-default-class-with-the-setting-library-name--class-name
		globalObject: 'this',
		// chunkFormat: false,
		// chunkLoading: false
	},
	target: ['web', 'node'],
	externals: {
		react: 'commonjs2 react',
		'react/jsx-runtime': 'commonjs2 react/jsx-runtime',
		'react-dom': 'commonjs2 react-dom',
		'boundless-api-client': 'commonjs2 boundless-api-client'
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'babel-loader'
					},
					{
						loader: 'ts-loader',
						options: {
							compilerOptions: require('./tsconfig.json').compilerOptions
						},
					}
				]
			},
			{
				test: /\.scss$/,
				use: [
					{
						loader: 'style-loader',
					},
					{
						loader: 'css-loader',
					},
					{
						loader: 'postcss-loader'
					},
					{
						loader: 'sass-loader'
					},
				],
			},
			{
				test: /\.css$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'}
				],
			},
		]
	}
};