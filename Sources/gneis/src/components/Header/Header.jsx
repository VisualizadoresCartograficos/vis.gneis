'use client';
import { useCallback, useEffect, useState } from 'react';
import i18next from '@/app/languages/i18n';
import {
	AUTH_CHANGED_EVENT,
	getActiveAuth,
	resolveProfileLabel,
	resolveUserEmail,
} from '@/utils/sessionAuth';

import { getLanguage } from '@/utils/Utils';

import './Header.css';

import MINISTERIO from '@/static/logos/logo_ministerio.png';
import GNEIS from '@/static/logos/Logo-GNEIS.svg';

function Header({ onRequestLogin, onLogout }) {
	const [langSelected, setLangSelected] = useState(getLanguage());
	const [auth, setAuth] = useState(getActiveAuth());
	const profileLabel = resolveProfileLabel(auth?.roles);
	const userEmail = resolveUserEmail(auth);
	const isLoggedIn = !!auth?.access_token;

	const syncAuthFromStore = useCallback(() => {
		setAuth(getActiveAuth());
	}, []);

	useEffect(() => {
		window.addEventListener(AUTH_CHANGED_EVENT, syncAuthFromStore);
		syncAuthFromStore();

		return () => window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthFromStore);
	}, [syncAuthFromStore]);

	const changeLanguage = (lang) => {
		setLangSelected(lang);
		i18next.changeLanguage(lang);
		window.location.reload();
	};

	const goToPortal = () => {
		const portalUrl = process.env.NEXT_PUBLIC_GNEIS_PORTAL_URL;
		if (portalUrl) window.location.href = portalUrl;
	};

		return (
			<header className="visor-header">
				<div className="visor-header__inner">
					<div className="visor-header__brand">
						<img src={MINISTERIO.src} className="visor-header__logo-ministerio" alt={i18next.t('header.altMinisterio')}/>
						<img src={GNEIS.src} className="visor-header__logo-gneis" alt={i18next.t('header.altGneis')}/>
						<span className="visor-header__claim">{i18next.t('header.brand')}</span>
					</div>

					<div className="visor-header__actions">
						<nav className="visor-header__lang" aria-label={i18next.t('header.langSelector')}>
							<button type="button" className={`visor-header__lang-link${langSelected === 'es' ? ' is-active' : ''}`} onClick={() => changeLanguage('es')}>ES</button>
							<span className="visor-header__lang-sep" aria-hidden="true">|</span>
							<button type="button" className={`visor-header__lang-link${langSelected === 'en' ? ' is-active' : ''}`} onClick={() => changeLanguage('en')}>EN</button>
						</nav>

						{isLoggedIn ? (
							<>
								<div className="visor-header__user" title={userEmail || undefined}>
									{userEmail && ( <span className="visor-header__user-email">{userEmail}</span> )}
									{profileLabel && ( <span className="visor-header__user-role">{profileLabel}</span> )}
								</div>
								<button type="button" className="visor-header__btn-logout" onClick={onLogout} > {i18next.t('header.logout')} </button>
							</>
						) : (
							<button type="button" className="visor-header__btn-login" onClick={onRequestLogin} > {i18next.t('header.login')} </button>
						)}
						<button type="button" className="visor-header__btn-portal" onClick={goToPortal} > {i18next.t('header.portal')} </button>
					</div>
				</div>
 		</header>
	);
}

export default Header;
