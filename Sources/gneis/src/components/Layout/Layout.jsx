'use client';
import { Component } from 'react';
import { withTranslation } from 'react-i18next';

import Header from '@/components/Header/Header';
import CircleSpinner from '@/components/Helpers/Spinner';
import LoginModal from '@/components/LoginModal/LoginModal';
import { isEmbeddedInPortal } from '@/utils/parentAuth';
import { applyViewerLanguage, resolveViewerLanguage } from '@/utils/locale';
import {
	AUTH_SESSION_EXPIRED_EVENT,
	loginWithPassword,
	logout,
	restoreStandaloneSession,
	scheduleTokenRefresh,
	setActiveAuth,
} from '@/utils/sessionAuth';
import { initMap } from '@/utils/visualizador';

import './Layout.css';

const parseIncludeHeader = () => {
	if (typeof window === 'undefined') {
		return true;
	}
	const value = new URLSearchParams(window.location.search).get('includeHeader');
	if (value === null) {
		return true;
	}
	return value.toLowerCase() !== 'false';
};

class Viewer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			blocking: true,
			includeHeader: parseIncludeHeader(),
			showLogin: false,
			loginOptional: false,
			mapStarted: false,
		};
		this.mapInitStarted = false;
	}

	componentDidMount() {
		applyViewerLanguage(resolveViewerLanguage());

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
		if (isEmbeddedInPortal()) {
			this.startMap();

			return;
		}

		try {
			const restored = await restoreStandaloneSession();

			if (restored?.access_token) {
				this.startMap(restored);

				return;
			}
		}
		catch (err) {
			console.warn('[Visor] No se pudo restaurar sesión standalone', err);
		}

		this.setState({
			showLogin: true,
			loginOptional: false,
			blocking: false,
		});
	};

	startMap = (sessionAuth) => {
		if (this.mapInitStarted) {
			return;
		}

		this.mapInitStarted = true;
		this.setState({
			showLogin: false,
			loginOptional: false,
			blocking: true,
			mapStarted: true,
		});
		initMap(this.block, this.unblock, sessionAuth);
	};

	handleRequestLogin = () => {
		this.setState({
			showLogin: true,
			loginOptional: this.mapInitStarted,
			blocking: false,
		});
	};

	handleCloseLogin = () => {
		if (!this.state.loginOptional) {
			return;
		}

		this.setState({
			showLogin: false,
			loginOptional: false,
		});
	};

	handleLogin = async (username, password) => {
		const auth = await loginWithPassword(username, password);
		setActiveAuth(auth);
		scheduleTokenRefresh(auth);

		if (this.mapInitStarted) {
			window.location.reload();

			return;
		}

		this.startMap(auth);
	};

	handleGuest = () => {
		setActiveAuth(null);

		if (this.mapInitStarted) {
			this.setState({
				showLogin: false,
				loginOptional: false,
			});

			return;
		}

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

	render() {
		const { blocking, includeHeader, showLogin, loginOptional } = this.state;
		const visorWrapperClass = includeHeader
			? 'visor-wrapper'
			: 'visor-wrapper visor-wrapper--no-header';

		return (
			<>
				<div className='content-wrapper'>
					{includeHeader ? (
						<Header
							onLogout={this.handleLogout}
							onRequestLogin={this.handleRequestLogin}
						/>
					) : null}
					<div
						className={visorWrapperClass}
						style={{ flexDirection: window.innerWidth < 700 ? 'column' : 'row' }}
					>
						<div className='map' id='map'></div>
					</div>
				</div>
				{showLogin ? (
					<LoginModal
						allowGuest={!loginOptional}
						onClose={loginOptional ? this.handleCloseLogin : undefined}
						onGuest={this.handleGuest}
						onLogin={this.handleLogin}
					/>
				) : null}
				{blocking ?
					<div className="block-loader-container">
						<CircleSpinner width={128} height={128} />
					</div>
					: null
				}
			</>
		);
	}
}

export default withTranslation()(Viewer)
