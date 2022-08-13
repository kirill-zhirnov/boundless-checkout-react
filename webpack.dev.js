const path = require('path');
const webpack = require('webpack');
// const fs = require('fs');
// if (fs.existsSync(path.resolve(__dirname, './.env'))) {
// 	require('dotenv').config();
// }
const WebpackAssetsManifest = require('webpack-assets-manifest');
const runtimePath =  path.resolve(__dirname, 'runtime');

module.exports = {
	entry: {
		dev: './src/dev/dev-client.ts'
	},
	mode: 'development',
	cache: false,
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.json']
	},
	output: {
		// publicPath: 'http://localhost:9050/',
		filename: '[name].[fullhash].js',
		chunkFilename: '[name].bundle.[chunkhash].js',
		library: 'BoundlessCheckout'
	},
	// devServer: {
	// 	port: 9090,
	// 	hot: true,
	// 	historyApiFallback: {
	// 		index: path.resolve(__dirname, './src/index.ejs'),
	// 		rewrites: [
	// 			// { from: /^\/$/, to: '/views/landing.html' },
	// 		]
	// 	}
	// },
	// output: {
	// 	path: path.resolve(__dirname, 'dist'),
	// 	library: 'BoundlessCheckout',
	// 	filename: 'index.js',
	// 	libraryTarget: 'umd',
	// 	// this to support both browser and Node.
	// 	// https://github.com/riversun/making-library-with-webpack#1-4publish-an-export-default-class-with-the-setting-library-name--class-name
	// 	globalObject: 'this',
	// },
	// externals: {
	// 	react: 'commonjs2 react',
	// 	'react/jsx-runtime': 'commonjs2 react/jsx-runtime',
	// 	'react-dom': 'commonjs2 react-dom',
	// 	'boundless-api-client': 'commonjs2 boundless-api-client'
	// },

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
	},

	plugins: [
		// new webpack.HotModuleReplacementPlugin(),
		new webpack.DefinePlugin({
			'process.env.DEV_CART_ID': JSON.stringify(process.env.DEV_CART_ID),
			'process.env.DEV_BOUNDLESS_INSTANCE_TOKEN': JSON.stringify(process.env.DEV_BOUNDLESS_INSTANCE_TOKEN),
			'process.env.DEV_BOUNDLESS_INSTANCE_ID': JSON.stringify(process.env.DEV_BOUNDLESS_INSTANCE_ID),
		}),
		new WebpackAssetsManifest({
			writeToDisk: true,
			output: `${runtimePath}/manifest.json`,
			publicPath: true
		}),
	],
};