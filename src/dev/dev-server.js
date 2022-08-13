import express from 'express';
import middleware from 'webpack-dev-middleware';
import webpack from 'webpack';
import fs from 'fs';
import path from 'path';

if (fs.existsSync(path.resolve(__dirname, '../../.env'))) {
	require('dotenv').config();
}

const app = express();
app.get('/', (req, res) => {
	res.send('Hello World!');
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Example app listening on port ${port}`));