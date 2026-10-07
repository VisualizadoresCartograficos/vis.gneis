export function getLanguage() {
  const searchParams = new URLSearchParams(window.location.search.replace('?', ''));
  
	return searchParams.get('lang') ? normalizeLang( searchParams.get('lang') ) : normalizeLang(window.localStorage.i18nextLng) || 'es';
}

function normalizeLang(value) {
  if (!value || typeof value !== 'string') return null;

  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('es')) return 'es';
  return null;
}