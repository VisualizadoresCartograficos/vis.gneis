/**
 * Bridge de autenticación con el portal Liferay cuando el visor va embebido
 * en un iframe (portlet VisorGneis).
 *
 * El padre escucha {@code GNEIS_AUTH_REQUEST} y responde con
 * {@code GNEIS_AUTH_RESPONSE} (access_token / refresh_token de la sesión).
 */

import {
	getActiveAuth,
	installAuthLoopGuard,
	isAuthRefreshExhausted,
	resetAuthLoopGuard,
	setActiveAuth,
} from './sessionAuth';

const AUTH_REQUEST_TYPE = 'GNEIS_AUTH_REQUEST';
const AUTH_RESPONSE_TYPE = 'GNEIS_AUTH_RESPONSE';
const LOG_PREFIX = '[Visor:parentAuth]';

/**
 * @param {string|null|undefined} token
 * @returns {string|null}
 */
function maskToken(token) {
	if (!token || typeof token !== 'string') return null;

	if (token.length <= 12) return '***';

	return `${token.slice(0, 6)}…${token.slice(-4)} (len=${token.length})`;
}

/**
 * @returns {string|null}
 */
export function getPortalOrigin() {
	const portalUrl = process.env.NEXT_PUBLIC_GNEIS_PORTAL_URL;
	if (!portalUrl) return null;

	try {
		return new URL(portalUrl).origin;
	} catch (err) {
		console.error(LOG_PREFIX, 'NEXT_PUBLIC_GNEIS_PORTAL_URL inválida', err);
		return null;
	}
}

/**
 * @returns {boolean}
 */
export function isEmbeddedInPortal() {
	if (typeof window === 'undefined') return false;

	try {
		return window.parent !== window;
	} catch (err) {
		return true;
	}
}

/**
 * @param {{ type: string, requestId?: string, access_token?: string, refresh_token?: string|null }|null|undefined} data
 * @returns {boolean}
 */
function isExpectedAuthResponse(data, requestId) {
	return !!data && data.type === AUTH_RESPONSE_TYPE && data.requestId === requestId;
}

/**
 * @param {string} portalOrigin
 * @param {string} requestId
 * @param {MessageEvent} event
 * @returns {boolean}
 */
function shouldHandleParentMessage(portalOrigin, requestId, event) {
	if (event.origin !== portalOrigin) {
		if (event.data?.type === AUTH_RESPONSE_TYPE) {
			console.warn(LOG_PREFIX, 'GNEIS_AUTH_RESPONSE ignorado: origin', {
				eventOrigin: event.origin,
				expectedOrigin: portalOrigin,
			});
		}

		return false;
	}

	return isExpectedAuthResponse(event.data, requestId);
}

/**
 * @param {string} requestId
 * @param {{ access_token?: string, refresh_token?: string|null }|null|undefined} data
 * @returns {{ access_token: string, refresh_token: string|null }|null}
 */
function buildParentAuthResponse(requestId, data) {
	if (!data?.access_token) {
		console.warn(LOG_PREFIX, 'Padre respondió sin access_token → login modal', { requestId });
		return null;
	}

	console.info(LOG_PREFIX, 'GNEIS_AUTH_RESPONSE recibido', {
		requestId,
		access_token: maskToken(data.access_token),
		refresh_token: maskToken(data.refresh_token),
		hasAccessToken: !!data.access_token,
	});

	return {
		access_token: data.access_token,
		refresh_token: data.refresh_token || null,
	};
}

/**
 * Pide al portal padre los tokens OAuth2 de la sesión Liferay.
 *
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ access_token: string, refresh_token: string|null }|null>}
 */
export function requestParentAuth({ timeoutMs = 2500 } = {}) {
	return new Promise((resolve) => {
		const embedded = isEmbeddedInPortal();
		const portalOrigin = getPortalOrigin();

		console.info(LOG_PREFIX, 'requestParentAuth inicio', {
			embedded,
			portalOrigin,
			pageOrigin: typeof window !== 'undefined' ? window.location.origin : null,
			timeoutMs,
		});

		if (!embedded) {
			console.info(LOG_PREFIX, 'No embebido → sin tokens de padre');
			resolve(null);

			return;
		}

		if (!portalOrigin) {
			console.warn(LOG_PREFIX, 'Sin portalOrigin → sin tokens de padre');
			resolve(null);

			return;
		}

		const requestId = `gneis-auth-${Date.now()}-${Math.random().toString(36).slice(2)}`;

		const cleanup = () => {
			window.clearTimeout(timerId);
			window.removeEventListener('message', onMessage);
		};

		const onMessage = (event) => {
			if (!shouldHandleParentMessage(portalOrigin, requestId, event)) return;

			const response = buildParentAuthResponse(requestId, event.data);
			cleanup();
			resolve(response);
		};

		const timerId = window.setTimeout(() => {
			cleanup();
			console.warn(LOG_PREFIX, 'Timeout esperando GNEIS_AUTH_RESPONSE', {
				requestId,
				timeoutMs,
				portalOrigin,
			});
			resolve(null);
		}, timeoutMs);

		window.addEventListener('message', onMessage);

		try {
			console.info(LOG_PREFIX, 'postMessage GNEIS_AUTH_REQUEST → padre', {
				requestId,
				targetOrigin: portalOrigin,
			});
			window.parent.postMessage(
				{
					type: AUTH_REQUEST_TYPE,
					requestId,
				},
				portalOrigin,
			);
		} catch (err) {
			console.error(LOG_PREFIX, 'No se pudo solicitar auth al portal padre', err);
			cleanup();
			resolve(null);
		}
	});
}

/**
 * @param {{ access_token?: string, refresh_token?: string|null }|null|undefined} current
 * @param {{ access_token?: string, refresh_token?: string|null }} patch
 * @returns {{ access_token: string, refresh_token: string|null }|null}
 */
function updateActiveAuth(current, patch) {
	if (!current) return null;

	const next = {
		...current,
		...patch,
	};

	setActiveAuth(next);
	return next;
}

/**
 * @param {any} instance
 */
function installCatalogTokenAccessors(instance) {
	Object.defineProperty(instance, 'token', {
		configurable: true,
		enumerable: true,
		get() {
			return getActiveAuth()?.access_token || null;
		},
		set(value) {
			const current = getActiveAuth();
			if (current) {
				updateActiveAuth(current, { access_token: value });
			}
		},
	});

	Object.defineProperty(instance, 'refreshToken', {
		configurable: true,
		enumerable: true,
		get() {
			if (isAuthRefreshExhausted()) return null;

			return getActiveAuth()?.refresh_token || null;
		},
		set(value) {
			if (isAuthRefreshExhausted()) return;

			const current = getActiveAuth();
			if (current) {
				updateActiveAuth(current, { refresh_token: value });
			}
		},
	});

	console.info(LOG_PREFIX, 'Catalog privado con token inyectado', {
		title: instance.title,
		public: instance.public,
		access_token: maskToken(instance.token),
		refresh_token: maskToken(instance.refreshToken),
	});
}

/**
 * Parchea {@code IDEE.stac.Catalog} para inyectar tokens del portal en
 * catálogos privados (evita el diálogo de login del Catalogmanager).
 * El token se lee de {@link getActiveAuth} para soportar refresh en vivo.
 *
 * @param {{ access_token: string, refresh_token?: string|null, expires_in?: number }|null} auth
 * @returns {() => void} función para restaurar el constructor original
 */
export function installParentAuthOnCatalog(auth) {
	if (!auth?.access_token || typeof window === 'undefined' || !window.IDEE?.stac?.Catalog) {
		console.warn(LOG_PREFIX, 'installParentAuthOnCatalog NO aplicado', {
			hasAuth: !!auth?.access_token,
			hasCatalog: !!window?.IDEE?.stac?.Catalog,
		});

		return () => {};
	}

	installAuthLoopGuard();
	resetAuthLoopGuard();
	setActiveAuth(auth);

	const OriginalCatalog = window.IDEE.stac.Catalog;

	class CatalogWithParentAuth extends OriginalCatalog {
		constructor(options = {}) {
			super(options);

			if (!this.public) {
				installCatalogTokenAccessors(this);
			}
		}
	}

	window.IDEE.stac.Catalog = CatalogWithParentAuth;
	console.info(LOG_PREFIX, 'IDEE.stac.Catalog parcheado con auth');

	return () => {
		window.IDEE.stac.Catalog = OriginalCatalog;
	};
}
