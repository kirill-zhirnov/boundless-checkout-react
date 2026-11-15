# Boundless Checkout React Component CP

## Installation

`yarn add boundless-checkout-react-cp` 

Or via NPM:

`npm install boundless-checkout-react-cp --save`

## Getting Started

Add the checkout component to your React checkout page:

```jsx
import {BoundlessCheckout} from 'boundless-checkout-react-cp';

export default function CheckoutPage() {
	return (
		<BoundlessCheckout
			cartId="uid"
			logoSrc="https://domain/logo.png"
			onHide={(element) => console.log('on hide', element)}
			onThankYouPage={async (data) => console.log('on thank you page', data)}
			payfirmaInfo={{
				token: 'payfirma-token',
				environment: 'sandbox',
				endpoint: 'https://payfirma-endpoint.example'
			}}
		/>
	);
}
```

Props `onHide`, `onThankYouPage`, and `payfirmaInfo` are required. Other props are optional.

Need more example? Look at: [Checkout page at Next.js](https://github.com/kirill-zhirnov/boundless-nextjs-sample/blob/master/pages/checkout/%5B%5B...slug%5D%5D.tsx)

---

[NextJS eCommerce templates](https://boundless-commerce.com/templates) - Free. Ready to use. Just clone & deploy!

## Tests

Tests run with Vitest and jsdom (Node.js 22.12+ or 24+).

- `npm test` — run all tests once, including in CI.
- `npm test -- src/lib/deliveryQuote.test.ts` — run a single test file.
- `npx vitest` — run tests in watch mode.

## Fallow commands
fallow                       # Full codebase analysis: cleanup + duplication + health
fallow audit                 # Audit changed files (verdict: pass/warn/fail)
fallow health                # Complexity + refactor targets
fallow health --css          # + structural CSS analytics (specificity, !important, nesting)
fallow dupes                 # Repeated logic
fallow dead-code             # Cleanup candidates
fallow security              # Security candidates, hardcoded-secret needs explicit category include
fallow security survivors    # Render verifier-filtered survivor candidates
fallow security blind-spots  # Group unresolved security callees
fallow explain unused-export # Explain a rule without analyzing
fallow watch                 # Re-analyze on file changes
fallow fix --dry-run         # Preview automatic cleanup
