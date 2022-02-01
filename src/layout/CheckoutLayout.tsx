import React, {ReactNode} from 'react';

export default function CheckoutLayout({children}: {children: ReactNode | ReactNode[]}) {
	return (
		<section>
			{children}
		</section>
	);
}