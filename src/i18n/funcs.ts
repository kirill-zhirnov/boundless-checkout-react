import i18n, {InitOptions} from 'i18next';
import {initReactI18next} from 'react-i18next';
import en from './en.json';

export const initI18n = () => {
	i18n
		.use(initReactI18next)
	;

	const options: InitOptions = {
		lng: 'en',
		fallbackLng: 'en',
		interpolation: {
			escapeValue: false
		},
		resources: {
			en: {
				translation: en
			}
		}
	};

	i18n.init(options);
	return i18n;
};