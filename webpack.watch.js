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
						loader: 'ts-loader',
						options: {
							compilerOptions: Object.assign(require('./tsconfig.json').compilerOptions, {
								declarationDir: path.resolve(__dirname, 'dist')
							})
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