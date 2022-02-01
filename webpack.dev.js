const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './src/dev.tsx',
	mode: 'development',
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.json']
	},
	output: {
		publicPath: 'http://localhost:9010/',
		filename: '[name].bundle.js',
		chunkFilename: '[name].bundle.js?ver=[chunkhash]',
	},
	devServer: {
		compress: true,
		port: 9010,
		hot: true,
		headers: {
			'Access-Control-Allow-Origin': '*'
		},
		historyApiFallback: {
			index: 'index.html'
		}
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
		]
	},
	plugins: [
		new HtmlWebpackPlugin()
	]
};