'use client';
import { Component } from 'react';
import i18next from '@/app/languages/i18n';
import { withTranslation } from 'react-i18next';
import {
	AUTH_SESSION_EXPIRED_EVENT,
	loginWithPassword,
	logout,
	restoreStandaloneSession,
	scheduleTokenRefresh,
	setActiveAuth,
} from '@/utils/sessionAuth';

import Header from '@/components/Header/Header';
import CircleSpinner from '@/components/Helpers/Spinner';
import LoginModal from '@/components/LoginModal/LoginModal';
import { isEmbeddedInPortal } from '@/utils/parentAuth';

import { initMap } from '@/utils/visualizador';
import { getLanguage } from '@/utils/Utils';

import './Layout.css';

const parseIncludeHeader = () => {
	const searchParams = new URLSearchParams(window.location.search);
	const value = searchParams.get('includeHeader');
	return value ? value.toLowerCase() !== 'false' : true;
};

class Layout extends Component {
	constructor(props) {
		super(props);
		this.state = {
			blocking: true,
			includeHeader: parseIncludeHeader(),
			showLogin: false,
			loginOptional: false,
			mapStarted: false,
		};
	}

	componentDidMount() {
		i18next.changeLanguage(getLanguage());
		window.addEventListener(
			AUTH_SESSION_EXPIRED_EVENT,
			this.handleSessionExpired,
		);
		this.bootstrapAuth();
	}

	componentWillUnmount() {
		window.removeEventListener(
			AUTH_SESSION_EXPIRED_EVENT,
			this.handleSessionExpired,
		);
	}

	handleSessionExpired = () => {
		this.setState({
			showLogin: false,
			loginOptional: false,
			blocking: false,
		});
	};

	bootstrapAuth = async () => {
		if (isEmbeddedInPortal()) this.startMap();

		try {
			const restored = await restoreStandaloneSession();
			if (restored?.access_token) this.startMap(restored);
		} catch (err) {
			console.warn('[Visor] No se pudo restaurar sesión standalone', err);
		}

		this.setState({
			showLogin: true,
			loginOptional: false,
			blocking: false,
		});
	};

	startMap = (sessionAuth) => {
		if (this.mapStarted)  return;

		this.setState({
			showLogin: false,
			loginOptional: false,
		}, () => {
			initMap(this.block, this.unblock, this.setMapStarted, sessionAuth);
		});
	};

	handleRequestLogin = () => {
		this.setState({
			showLogin: true,
			loginOptional: this.mapStarted,
			blocking: false,
		});
	};

	handleCloseLogin = () => {
		this.setState({
			showLogin: false,
			loginOptional: false,
		});
	};

	handleLogin = async (username, password) => {
		const auth = await loginWithPassword(username, password);
		setActiveAuth(auth);
		scheduleTokenRefresh(auth);

		if (this.mapStarted) window.location.reload();
		this.startMap(auth);
	};

	handleGuest = () => {
		setActiveAuth(null);
		this.startMap(null);
	};

	handleLogout = () => {
		logout({ reason: 'user_logout', expired: false });
		window.location.reload();
	};

	block = () => {
		this.setState({ blocking: true });
	};

	unblock = () => {
		this.setState({ blocking: false });
	};

	setMapStarted = () => {
		this.setState({ mapStarted: true });
	}

	render() {
		const { blocking, includeHeader, showLogin, loginOptional } = this.state;

		return (
			<>
				<div className='content-wrapper'>
					{includeHeader && (
						<Header
							onLogout={this.handleLogout}
							onRequestLogin={this.handleRequestLogin}
						/>
					)}
					<div
						className={`visor-wrapper ${includeHeader ? '' : 'visor-wrapper--no-header'}`}
						style={{ flexDirection: window.innerWidth < 700 ? 'column' : 'row' }}
					>
						<div className='map' id='map'></div>
					</div>
				</div>
				{showLogin && (
					<LoginModal
						onLogin={this.handleLogin}
						onGuest={this.handleGuest}
						onClose={loginOptional ? this.handleCloseLogin : undefined}
						allowGuest={!loginOptional}
					/>
				)}
				{blocking && (
					<CircleSpinner width={128} height={128} />
				)}
			</>
		);
	}
}

export default withTranslation()(Layout);
