import i18n from '@/app/languages/i18n';

import { isEmbeddedInPortal } from './parentAuth';

const SUPPORTED_LANGS = ['es', 'en'];
const DEFAULT_LANG = 'es';

/**
 * @returns {boolean}
 */
export function isEmbeddedViewer() {
	if (typeof window === 'undefined') {
		return false;
	}

	if (isEmbeddedInPortal()) {
		return true;
	}

	const includeHeader = new URLSearchParams(window.location.search).get(
		'includeHeader',
	);

	return includeHeader !== null &&
		includeHeader.toLowerCase() === 'false';
}

/**
 * Normaliza es_ES / en_US / es / en → es | en.
 *
 * @param {string|null|undefined} value
 * @returns {'es'|'en'|null}
 */
export function normalizeLang(value) {
	if (!value || typeof value !== 'string') {
		return null;
	}

	const normalized = value.trim().toLowerCase();

	if (normalized.startsWith('en')) {
		return 'en';
	}

	if (normalized.startsWith('es')) {
		return 'es';
	}

	return null;
}

/**
 * Idioma del visor: en embed prioriza ?lang= del portal Liferay;
 * en standalone usa localStorage / navegador.
 *
 * @returns {'es'|'en'}
 */
export function resolveViewerLanguage() {
	if (typeof window === 'undefined') {
		return DEFAULT_LANG;
	}

	if (isEmbeddedViewer()) {
		const fromQuery = normalizeLang(
			new URLSearchParams(window.location.search).get('lang'),
		);

		if (fromQuery) {
			return fromQuery;
		}
	}

	const fromStorage = normalizeLang(window.localStorage?.i18nextLng);

	if (fromStorage) {
		return fromStorage;
	}

	return DEFAULT_LANG;
}

/**
 * Aplica idioma a i18next, API-IDEE y (solo standalone) localStorage.
 *
 * @param {'es'|'en'} lang
 */
export function applyViewerLanguage(lang) {
	const resolved = normalizeLang(lang) || DEFAULT_LANG;

	if (!isEmbeddedViewer()) {
		window.localStorage.setItem('i18nextLng', resolved);
	}

	i18n.changeLanguage(resolved);

	if (window.IDEE?.language?.setLang) {
		window.IDEE.language.setLang(resolved);
	}

	return resolved;
}

export { DEFAULT_LANG, SUPPORTED_LANGS };
