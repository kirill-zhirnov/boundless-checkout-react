const path = require('path');

module.exports = {
	entry: './src/index.ts',
	mode: 'development',
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.json']
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		library: 'BoundlessCheckout',
		filename: 'index.js',
		libraryTarget: 'umd',
		// this to support both browser and Node.
		// https://github.com/riversun/making-library-with-webpack#1-4publish-an-export-default-class-with-the-setting-library-name--class-name
		globalObject: 'this',
	},

	externals: {
		react: 'react',
		'react/jsx-runtime': 'react/jsx-runtime',
		'react-dom': 'react-dom'
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				exclude: /node_modules/,
				use: [
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
			/*{
				test: /\.(png|jpe?g|gif|svg|eot|otf|woff|woff2|ttf)$/,
				type: 'asset'
			},*/
		]
	}
};