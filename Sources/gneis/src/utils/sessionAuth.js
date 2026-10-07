/**
 * Auth de sesión para el visor en modo standalone (fuera del iframe).
 * Login: POST /o/custom-auth/token
 * Refresh: POST /o/custom-auth/refresh-token
 *
 * Guard anti-bucle: API-IDEE (Catalog) ante 401 STAC hace refresh y reintenta.
 * Si el refresh va bien pero STAC sigue en 401, se corta el refreshToken.
 */

const STORAGE_KEY = 'gneis-visor-auth';
const LOG_PREFIX = '[Visor:sessionAuth]';

export const AUTH_CHANGED_EVENT = 'gneis:auth-changed';
export const AUTH_SESSION_EXPIRED_EVENT = 'gneis:auth-session-expired';

/** Tras un refresh OK, si STAC vuelve a 401 se agota el refresh. */
const MAX_REFRESH_BEFORE_STAC_OK = 1;
/** Tope duro de POSTs refresh-token en ventana corta (peticiones concurrentes). */
const MAX_REFRESH_CALLS_IN_WINDOW = 2;
const REFRESH_WINDOW_MS = 15_000;

/**
 * @typedef {{ emailAddress?: string, fullName?: string, id?: string, screenName?: string }} VisorUser
 * @typedef {{
 *   access_token: string,
 *   refresh_token: string|null,
 *   expires_in?: number,
 *   roles?: string[],
 *   collections?: string[],
 *   user?: VisorUser|null,
 * }} VisorAuth
 */

/** @type {VisorAuth|null} */
let activeAuth = null;

/** @type {ReturnType<typeof setTimeout>|null} */
let refreshTimerId = null;

/** Refresh agotado tras bucle 401 STAC (Catalog deja de recibir refreshToken). */
let authRefreshExhausted = false;

/** Hay un 401 STAC pendiente de resolver con refresh. */
let stac401Pending = false;

/** Refreshes OK mientras hay 401 STAC pendiente. */
let refreshesAfterStac401 = 0;

/** @type {number[]} */
let refreshCallTimestamps = [];

let authLoopGuardInstalled = false;

/**
 * @returns {string|null}
 */
function getPortalUrl() {
	const portalUrl = process.env.NEXT_PUBLIC_GNEIS_PORTAL_URL;

	if (!portalUrl) {
		return null;
	}

	return portalUrl.replace(/\/$/, '');
}

/**
 * Holder mutable leído por el Catalog parcheado (token vivo tras refresh).
 * @returns {VisorAuth|null}
 */
export function getActiveAuth() {
	return activeAuth;
}

/**
 * @param {VisorAuth|null|undefined} auth
 * @returns {VisorAuth|null}
 */
function normalizeAuth(auth) {
	if (!auth?.access_token) return null;

	const previous = activeAuth;

	return {
		access_token: auth.access_token,
		refresh_token: authRefreshExhausted
			? null
			: (auth.refresh_token || null),
		expires_in: auth.expires_in || 3600,
		roles: Array.isArray(auth.roles)
			? auth.roles
			: (previous?.roles || []),
		collections: Array.isArray(auth.collections)
			? auth.collections
			: (previous?.collections || []),
		user: auth.user !== undefined
			? (auth.user || null)
			: (previous?.user || null),
	};
}

/**
 * @param {Record<string, any>|null|undefined} data
 * @param {VisorAuth|null|undefined} previous
 * @returns {VisorAuth|null}
 */
function buildAuthFromResponse(data, previous = null) {
	if (!data || typeof data !== 'object' || !data.access_token) return null;

	return normalizeAuth({
		access_token: data.access_token,
		refresh_token: data.refresh_token || previous?.refresh_token || null,
		expires_in: data.expires_in || previous?.expires_in || 3600,
		roles: Array.isArray(data.roles) ? data.roles : previous?.roles || [],
		collections: Array.isArray(data.collections)
			? data.collections
			: previous?.collections || [],
		user: data.user !== undefined ? data.user : previous?.user || null,
	});
}

/**
 * @param {VisorAuth|null} auth
 */
export function setActiveAuth(auth) {
	activeAuth = normalizeAuth(auth);

	if (activeAuth) {
		saveStoredAuth(activeAuth);
	} else {
		clearStoredAuth();
	}

	notifyAuthChanged();
}

/**
 * @param {Response} response
 * @returns {Promise<Record<string, any>|null>}
 */
async function parseJsonResponse(response) {
	const text = await response.text();
	if (!text) return null;

	try {
		return JSON.parse(text);
	} catch (err) {
		return null;
	}
}

function notifyAuthChanged() {
	if (typeof window === 'undefined') return;

	window.dispatchEvent(
		new CustomEvent(AUTH_CHANGED_EVENT, {
			detail: { auth: activeAuth },
		}),
	);
}

/**
 * Etiqueta de perfil: Admin > AA:PP > General.
 * @param {string[]|null|undefined} roles
 * @returns {'Admin'|'AA:PP'|'General'|null}
 */
export function resolveProfileLabel(roles) {
	if (!Array.isArray(roles) || roles.length === 0) return null;

	const normalized = roles.map((role) => String(role).trim().toLowerCase());

	if (normalized.some((role) => role === 'administrator' || role === 'admin')) return 'Admin';

	if (normalized.some((role) =>
		role === 'aa:pp' ||
		role === 'aapp' ||
		role === 'aa.pp' ||
		role.includes('aa:pp') ||
		role.includes('aapp'))) {
		return 'AA:PP';
	}

	if (normalized.some((role) => role === 'general')) return 'General';

	return null;
}

/**
 * @param {VisorAuth|null|undefined} auth
 * @returns {string|null}
 */
export function resolveUserEmail(auth) {
	const email = auth?.user?.emailAddress;
	if (email && typeof email === 'string' && email.trim()) return email.trim();

	const screenName = auth?.user?.screenName;
	if (screenName && typeof screenName === 'string' && screenName.trim()) return screenName.trim();

	return null;
}

/**
 * Cierra sesión (manual o por caducidad).
 * @param {{ reason?: string, expired?: boolean }} [options]
 */
export function logout(options = {}) {
	const { reason = 'logout', expired = false } = options;

	stopTokenRefresh();
	stac401Pending = false;
	refreshesAfterStac401 = 0;
	refreshCallTimestamps = [];
	activeAuth = null;
	clearStoredAuth();

	console.info(LOG_PREFIX, 'Sesión cerrada', { reason, expired });
	notifyAuthChanged();

	if (expired && typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent(AUTH_SESSION_EXPIRED_EVENT, {
				detail: { reason },
			}),
		);
	}
}

/**
 * @returns {boolean}
 */
export function isAuthRefreshExhausted() {
	return authRefreshExhausted;
}

/**
 * Reinicia el guard (login nuevo / sesión restaurada válida).
 */
export function resetAuthLoopGuard() {
	authRefreshExhausted = false;
	stac401Pending = false;
	refreshesAfterStac401 = 0;
	refreshCallTimestamps = [];
}

/**
 * Corta el bucle: sin refreshToken y sin más POST refresh-token.
 * Si había sesión, la destruye para volver a Login.
 */
export function exhaustAuthRefresh(reason = 'stac_401_after_refresh') {
	if (authRefreshExhausted) return;

	authRefreshExhausted = true;
	stopTokenRefresh();

	const hadSession = !!activeAuth?.access_token;

	console.error(LOG_PREFIX, 'Refresh cortado para evitar bucle', { reason });

	if (hadSession) {
		logout({ reason, expired: true });
	}
	else if (typeof window !== 'undefined') {
		window.dispatchEvent(
			new CustomEvent('gneis:auth-refresh-exhausted', { detail: { reason } }),
		);
	}
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isRefreshTokenUrl(url) {
	return typeof url === 'string' && url.includes('/o/custom-auth/refresh-token');
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isStacApiUrl(url) {
	if (!url || typeof url !== 'string' ) return false;

	const stacBase = process.env.NEXT_PUBLIC_GNEIS_STAC_URL || '';
	if (stacBase && url.startsWith(stacBase.replace(/\/$/, ''))) return true;

	try {
		const host = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined).hostname;
		return host.includes('stac-gneis') || host.includes('stac.');
	} catch (err) {
		return false;
	}
}

/**
 * @param {string} url
 * @returns {string}
 */
function normalizeRequestUrl(url) {
	if (!url) return '';

	try {
		return new URL(url, typeof window !== 'undefined' ? window.location.href : undefined).href;
	} catch (err) {
		return String(url);
	}
}

/**
 * @returns {boolean}
 */
function registerRefreshAttempt() {
	const now = Date.now();

	refreshCallTimestamps = refreshCallTimestamps.filter(
		(ts) => now - ts < REFRESH_WINDOW_MS
	);

	if (authRefreshExhausted) return false;

	if (refreshCallTimestamps.length >= MAX_REFRESH_CALLS_IN_WINDOW) {
		exhaustAuthRefresh('max_refresh_calls_in_window');
		return false;
	}

	refreshCallTimestamps.push(now);

	return true;
}

/**
 * @param {string} url
 * @returns {boolean}
 */
function isPortalCustomAuthUrl(url) {
	return typeof url === 'string' && url.includes('/o/custom-auth/');
}

/**
 * @param {string} url
 * @param {number} status
 */
function onAuthNetworkResponse(url, status) {
	const normalized = normalizeRequestUrl(url);

	if (isPortalCustomAuthUrl(normalized) && status === 401 && activeAuth?.access_token) {
		logout({ reason: 'portal_401', expired: true });

		return;
	}

	if (isRefreshTokenUrl(normalized) && status >= 200 && status < 300) {
		if (stac401Pending) {
			refreshesAfterStac401 += 1;

			if (refreshesAfterStac401 > MAX_REFRESH_BEFORE_STAC_OK) {
				exhaustAuthRefresh('too_many_refreshes_after_stac_401');
			}
		}

		return;
	}

	if (!isStacApiUrl(normalized)) return;

	if (status >= 200 && status < 300) {
		stac401Pending = false;
		refreshesAfterStac401 = 0;
		return;
	} else if (status === 401) {
		if (refreshesAfterStac401 >= MAX_REFRESH_BEFORE_STAC_OK) {
			exhaustAuthRefresh('stac_401_after_refresh');
			return;
		}
		stac401Pending = true;
	}
}

/**
 * Intercepta fetch + XHR (API-IDEE usa XHR) para limitar refresh tras 401 STAC.
 */
export function installAuthLoopGuard() {
	if (typeof window === 'undefined' || authLoopGuardInstalled)  return;

	const originalFetch = window.fetch.bind(window);

	window.fetch = async (input, init) => {
		const rawUrl =
			typeof input === 'string'
				? input
				: (input && typeof input === 'object' && 'url' in input
					? String(input.url)
					: '');
		const url = normalizeRequestUrl(rawUrl);

		if (isRefreshTokenUrl(url) && !registerRefreshAttempt()) {
			return new Response(
				JSON.stringify({ error: 'refresh_blocked', message: 'Auth refresh exhausted' }),
				{
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				},
			);
		}

		const response = await originalFetch(input, init);

		try {
			onAuthNetworkResponse(url, response.status);
		} catch (err) {
			console.warn(LOG_PREFIX, 'Error en auth loop guard (fetch)', err);
		}

		return response;
	};

	const OriginalXHR = window.XMLHttpRequest;

	function GuardedXMLHttpRequest() {
		const xhr = new OriginalXHR();
		let requestUrl = '';

		const originalOpen = xhr.open;

		xhr.open = function open(method, url, ...rest) {
			requestUrl = normalizeRequestUrl(String(url));
			return originalOpen.call(this, method, url, ...rest);
		};

		const originalSend = xhr.send;

		xhr.send = function send(...args) {
			if (isRefreshTokenUrl(requestUrl) && !registerRefreshAttempt()) {
				Object.defineProperty(this, 'status', { configurable: true, get: () => 401 });
				Object.defineProperty(this, 'readyState', { configurable: true, get: () => 4 });
				Object.defineProperty(this, 'responseText', {
					configurable: true,
					get: () => JSON.stringify({ error: 'refresh_blocked' }),
				});
				queueMicrotask(() => {
					this.dispatchEvent(new Event('error'));
					this.dispatchEvent(new Event('loadend'));
				});

				return;
			}

			return originalSend.apply(this, args);
		};

		xhr.addEventListener('load', () => {
			try {
				onAuthNetworkResponse(requestUrl, xhr.status);
			} catch (err) {
				console.warn(LOG_PREFIX, 'Error en auth loop guard (xhr)', err);
			}
		});

		return xhr;
	}

	GuardedXMLHttpRequest.prototype = OriginalXHR.prototype;
	Object.keys(OriginalXHR).forEach((key) => {
		try {
			GuardedXMLHttpRequest[key] = OriginalXHR[key];
		} catch (err) { } // ignore read-only
	});

	window.XMLHttpRequest = /** @type {typeof XMLHttpRequest} */ (GuardedXMLHttpRequest);

	authLoopGuardInstalled = true;
	console.info(LOG_PREFIX, 'Auth loop guard instalado');
}

/**
 * @param {VisorAuth} auth
 */
function saveStoredAuth(auth) {
	try {
		window.sessionStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({
				access_token: auth.access_token,
				refresh_token: auth.refresh_token || null,
				expires_in: auth.expires_in || 3600,
				roles: auth.roles || [],
				collections: auth.collections || [],
				user: auth.user || null,
				savedAt: Date.now(),
			}),
		);
	} catch (err) {
		console.warn(LOG_PREFIX, 'No se pudo guardar sesión', err);
	}
}

export function clearStoredAuth() {
	try {
		window.sessionStorage.removeItem(STORAGE_KEY);
	} catch (err) { }
}

/**
 * @returns {(VisorAuth & { savedAt: number })|null}
 */
export function loadStoredAuth() {
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const parsed = JSON.parse(raw);
		if (!parsed?.access_token) return null;

		return {
			access_token: parsed.access_token,
			refresh_token: parsed.refresh_token || null,
			expires_in: parsed.expires_in || 3600,
			roles: Array.isArray(parsed.roles) ? parsed.roles : [],
			collections: Array.isArray(parsed.collections) ? parsed.collections : [],
			user: parsed.user || null,
			savedAt: parsed.savedAt || 0,
		};
	} catch (err) {
		return null;
	}
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<VisorAuth>}
 */
export async function loginWithPassword(username, password) {
	const portalUrl = getPortalUrl();

	if (!portalUrl) {
		throw new Error('NEXT_PUBLIC_GNEIS_PORTAL_URL no configurada');
	}

	const response = await fetch(`${portalUrl}/o/custom-auth/token`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			username: username.trim(),
			password,
		}),
	});

	const data = await parseJsonResponse(response);

	if (!response.ok || !data?.access_token) {
		const message =
			data?.error ||
			data?.message ||
			`Login fallido (${response.status})`;

		throw new Error(message);
	}

	const auth = buildAuthFromResponse(data);

	resetAuthLoopGuard();
	setActiveAuth(auth);
	console.info(LOG_PREFIX, 'Login OK', {
		expires_in: auth.expires_in,
		hasRefresh: !!auth.refresh_token,
		profile: resolveProfileLabel(auth.roles),
		email: resolveUserEmail(auth),
	});

	return auth;
}

/**
 * @param {string} refreshToken
 * @returns {Promise<VisorAuth>}
 */
export async function refreshAccessToken(refreshToken) {
	if (authRefreshExhausted) {
		throw new Error('Refresh bloqueado (bucle de auth)');
	}

	const portalUrl = getPortalUrl();

	if (!portalUrl) {
		throw new Error('NEXT_PUBLIC_GNEIS_PORTAL_URL no configurada');
	}

	const response = await fetch(`${portalUrl}/o/custom-auth/refresh-token`, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			refreshToken,
		}),
	});

	const data = await parseJsonResponse(response);

	if (!response.ok || !data?.access_token) {
		const message =
			data?.error ||
			data?.message ||
			`Refresh fallido (${response.status})`;

		throw new Error(message);
	}

	if (authRefreshExhausted) {
		throw new Error('Refresh bloqueado (bucle de auth)');
	}

	const auth = buildAuthFromResponse(data, getActiveAuth());

	setActiveAuth(auth);
	console.info(LOG_PREFIX, 'Token renovado', {
		expires_in: auth.expires_in,
	});

	return auth;
}

/**
 * Programa renovación ~80% de expires_in.
 * @param {{ access_token: string, refresh_token?: string|null, expires_in?: number }|null} auth
 */
export function scheduleTokenRefresh(auth) {
	if (refreshTimerId) {
		window.clearTimeout(refreshTimerId);
		refreshTimerId = null;
	}

	if (!auth?.refresh_token || typeof window === 'undefined') return;

	const expiresInMs = Math.max(60, auth.expires_in || 3600) * 1000;
	const delayMs = Math.max(30_000, Math.floor(expiresInMs * 0.8));

	refreshTimerId = window.setTimeout(async () => {
		try {
			const current = getActiveAuth();
			const refreshToken = current?.refresh_token || auth.refresh_token;

			if (!refreshToken) {
				return;
			}

			const next = await refreshAccessToken(refreshToken);
			scheduleTokenRefresh(next);
		} catch (err) {
			console.error(LOG_PREFIX, 'No se pudo renovar el token', err);
			logout({ reason: 'refresh_failed', expired: true });
		}
	}, delayMs);

	console.info(LOG_PREFIX, 'Refresh programado', { delayMs });
}

export function stopTokenRefresh() {
	if (refreshTimerId) {
		window.clearTimeout(refreshTimerId);
		refreshTimerId = null;
	}
}

/**
 * Restaura sesión de sessionStorage; renueva si está cerca de caducar.
 * @returns {Promise<{ access_token: string, refresh_token: string|null, expires_in: number }|null>}
 */
export async function restoreStandaloneSession() {
	const stored = loadStoredAuth();
	if (!stored) return null;

	const ageMs = Date.now() - (stored.savedAt || 0);
	const expiresInMs = (stored.expires_in || 3600) * 1000;
	const shouldRefresh = !!stored.refresh_token && ageMs > expiresInMs * 0.5;

	try {
		resetAuthLoopGuard();

		if (shouldRefresh) {
			const next = await refreshAccessToken(stored.refresh_token);
			scheduleTokenRefresh(next);
			return next;
		}

		setActiveAuth(stored);
		scheduleTokenRefresh(stored);
		return stored;
	
	} catch (err) {
		console.warn(LOG_PREFIX, 'Sesión guardada inválida', err);
		logout({ reason: 'restore_failed', expired: true });
		return null;
	}
}
