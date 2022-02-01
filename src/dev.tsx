import React from 'react';
import ReactDom from 'react-dom';
import DevApp from './components/Dev';

const $root = document.createElement('div');
document.body.appendChild($root);

ReactDom.render(<div>DevApp<DevApp/></div>, $root);