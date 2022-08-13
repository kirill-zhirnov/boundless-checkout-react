const express = require('express');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const webPackDevConfig = require('../../webpack.dev');
// const webpackHotMiddleware = require('webpack-hot-middleware');

if (fs.existsSync(path.resolve(__dirname, '../../.env'))) {
	require('dotenv').config();
}

const compiler = webpack(webPackDevConfig);

const app = express();
app.set('views', path.resolve(__dirname, './views'));
app.set('view engine', 'ejs');

app.use(webpackDevMiddleware(compiler, {}));
// app.use(webpackHotMiddleware(compiler, {}));

app.use((req, res) => {
	const scripts = [];

	const manifestPath = path.resolve(__dirname, '../../runtime/manifest.json');
	if (fs.existsSync(manifestPath)) {
		const manifest = require(manifestPath);

		if (manifest['dev.js']) {
			scripts.push(manifest['dev.js']);
		}
	}

	res.render('index', {
		scripts,
		name: 'Ivan'
	});
});
// app.get('/', (req, res) => {
// 	res.send('Hello World!');
// });

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`App listening on port ${port}`));