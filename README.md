# Boundless Checkout React Component 

Checkout React Component for [Boundless Commerce](https://boundless-commerce.com/).

### About Boundless Commerce

API’s First Headless E-commerce CMS: We Provide An Admin-Side For Store Management, Powerful API, And Ready-To-Use
Checkout Area.

## Installation

Besides the checkout component the API client should be installed:

`yarn add boundless-api-client boundless-checkout-react` 

Or via NPM:

`npm install boundless-api-client boundless-checkout-react --save`

## Getting Started

1. Create client:

```js
import {BoundlessClient} from 'boundless-api-client';
const apiClient = new BoundlessClient('<YOUR PERMANENT TOKEN>');
apiClient.setInstanceId('<YOUR INSTANCE ID>');
```

2. Add component to the checkout page:

```jsx
import {startCheckout, StarterWrapper} from 'boundless-checkout-react';

const starter = startCheckout(document.querySelector('.some-el'), {
	api: apiClient,
	onHide: () => console.log('on hide'),
	onThankYouPage: (data) =>  console.log('on thank you page', data),
	basename: '/shop/checkout',
	cartId: 'uid',
	logoSrc: 'https://domain/logo.png',
	logoText: 'My Logo'
});
```

Props `api`, `onHide`, `onThankYouPage` - are required, others are optional.

`basename` - Start url for the checkout. If checkout located at `/checkout`, then `basename: '/checkout'`.

3. Need more example? Look at: [Checkout page at Next.js](https://github.com/kirill-zhirnov/boundless-nextjs-sample/blob/master/pages/checkout/%5B%5B...slug%5D%5D.tsx)

# Development process

1. Copy & adjust `.env.example` => `.env`
2. `yarn dev` - starts dev server at http://localhost:8080
3. Real component usage can be tested locally via yarn link or manually creation symbolic link in node_modules.
