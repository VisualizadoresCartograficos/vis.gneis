'use client';
import { Component } from 'react';
import { withTranslation } from 'react-i18next';
import i18n from '@/app/languages/i18n';

import './Header.css';

import MINISTERIO from '@/assets/logos/logo_ministerio.png';
import GNEIS from '@/assets/logos/Logo-GNEIS.svg';
import {
	AUTH_CHANGED_EVENT,
	getActiveAuth,
	resolveProfileLabel,
	resolveUserEmail,
} from '@/utils/sessionAuth';

class Header extends Component {
	constructor(props) {
		super(props);
		const auth = typeof window !== 'undefined' ? getActiveAuth() : null;

		this.state = {
			langSelected: window.localStorage.i18nextLng || 'es',
			auth,
			profileLabel: resolveProfileLabel(auth?.roles),
			userEmail: resolveUserEmail(auth),
		};
	}

	componentDidMount() {
		window.addEventListener(AUTH_CHANGED_EVENT, this.handleAuthChanged);
		this.syncAuthFromStore();
	}

	componentWillUnmount() {
		window.removeEventListener(AUTH_CHANGED_EVENT, this.handleAuthChanged);
	}

	syncAuthFromStore = () => {
		const auth = getActiveAuth();

		this.setState({
			auth,
			profileLabel: resolveProfileLabel(auth?.roles),
			userEmail: resolveUserEmail(auth),
		});
	};

	handleAuthChanged = () => {
		this.syncAuthFromStore();
	};

	changeLanguage = (lang) => {
		if (lang === this.state.langSelected) {
			return;
		}

		this.setState({ langSelected: lang }, () => {
			i18n.changeLanguage(lang);
			if (window.IDEE?.language?.setLang) {
				window.IDEE.language.setLang(lang);
			}
			window.location.reload();
		});
	};

	goToPortal = () => {
		const portalUrl = (process.env.NEXT_PUBLIC_GNEIS_PORTAL_URL || '').replace(/\/$/, '');

		if (!portalUrl) {
			console.warn('[Visor:Header] NEXT_PUBLIC_GNEIS_PORTAL_URL no configurada');

			return;
		}

		window.location.href = portalUrl;
	};

	render() {
		const { langSelected, auth, profileLabel, userEmail } = this.state;
		const { t, onRequestLogin, onLogout } = this.props;
		const isLoggedIn = !!auth?.access_token;

		return (
			<header className="visor-header">
				<div className="visor-header__inner">
					<div className="visor-header__brand">
						<img
							className="visor-header__logo-ministerio"
							src={MINISTERIO.src || MINISTERIO}
							alt={t('header.altMinisterio')}
						/>
						<img
							className="visor-header__logo-gneis"
							src={GNEIS.src || GNEIS}
							alt={t('header.altGneis')}
						/>
						<span className="visor-header__claim">{t('header.brand')}</span>
					</div>

					<div className="visor-header__actions">
						<nav className="visor-header__lang" aria-label={t('header.langSelector')}>
							<button
								type="button"
								className={`visor-header__lang-link${langSelected === 'es' ? ' is-active' : ''}`}
								onClick={() => this.changeLanguage('es')}
								aria-current={langSelected === 'es' ? 'true' : undefined}
							>
								ES
							</button>
							<span className="visor-header__lang-sep" aria-hidden="true">|</span>
							<button
								type="button"
								className={`visor-header__lang-link${langSelected === 'en' ? ' is-active' : ''}`}
								onClick={() => this.changeLanguage('en')}
								aria-current={langSelected === 'en' ? 'true' : undefined}
							>
								EN
							</button>
						</nav>

						{isLoggedIn ? (
							<>
								<div className="visor-header__user" title={userEmail || undefined}>
									{userEmail ? (
										<span className="visor-header__user-email">{userEmail}</span>
									) : null}
									{profileLabel ? (
										<span className="visor-header__user-role">{profileLabel}</span>
									) : null}
								</div>
								<button
									type="button"
									className="visor-header__btn-logout"
									onClick={onLogout}
								>
									{t('header.logout')}
								</button>
							</>
						) : (
							<button
								type="button"
								className="visor-header__btn-login"
								onClick={onRequestLogin}
							>
								{t('header.login')}
							</button>
						)}

						<button
							type="button"
							className="visor-header__btn-portal"
							onClick={this.goToPortal}
						>
							{t('header.portal')}
						</button>
					</div>
				</div>
			</header>
		);
	}
}

export default withTranslation()(Header);
