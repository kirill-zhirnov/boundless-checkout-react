const path = require('path');

module.exports = {
	entry: './src/index.ts',
	mode: 'production',
	resolve: {
		extensions: ['.tsx', '.ts', '.js', '.json']
	},
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'),
		library: {
			type: 'commonjs2',
		},
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
		]
	}
};