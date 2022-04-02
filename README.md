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
import {BoundlessCheckout} from 'boundless-checkout-react';

<BoundlessCheckout 
	cartId={cartId}
	show={true}
	onHide={() => console.log('on hide')}
	onThankYouPage={(data) =>  console.log('on thank you page', data)}
	api={apiClient}
	logo={<img src={logoImg.src} width={logoImg.width} height={logoImg.height} className={'bdl-header__img-logo'} />}
/>
```

3. Need more example? Look at: [Checkout page at Next.js](https://github.com/kirill-zhirnov/boundless-nextjs-sample/blob/master/pages/checkout/%5B%5B...slug%5D%5D.tsx)