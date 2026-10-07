'use client';
import { useState } from 'react';
import i18next from '@/app/languages/i18n';

import './LoginModal.css';

/**
 * Modal de acceso standalone: login o continuar como invitado (solo públicos).
 *
 * @param {{
 *   onLogin: (username: string, password: string) => Promise<void>,
 *   onGuest: () => void,
 *   onClose?: () => void,
 *   allowGuest?: boolean,
 *   busy?: boolean,
 * }} props
 */
export default function LoginModal({
	onLogin,
	onGuest,
	onClose,
	allowGuest = true,
	busy = false,
}) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const disabled = busy || submitting;

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError('');

		if (!username.trim() || !password) {
			setError(i18next.t('login.errorRequired'));
			return;
		}

		setSubmitting(true);

		try {
			await onLogin(username.trim(), password);
		}
		catch (err) {
			setError(err?.message || i18next.t('login.errorGeneric'));
			setSubmitting(false);
		}
	};

	return (
		<div aria-labelledby="gneis-login-title" aria-modal="true" className="gneis-login-modal" role="dialog">
			<div
				className="gneis-login-modal__backdrop"
				onClick={onClose}
				onKeyDown={(event) => {
					if (event.key === 'Escape' || event.key === 'Enter') {
						onClose();
					}
				}}
				role={onClose ? 'button' : undefined}
				tabIndex={onClose ? 0 : undefined}
			/>
			<div className="gneis-login-modal__panel">
				{onClose && (
					<button
						aria-label={i18next.t('login.close')}
						className="gneis-login-modal__close"
						disabled={disabled}
						onClick={onClose}
						type="button"
					>
						×
					</button>
				)}

				<h2 className="gneis-login-modal__title" id="gneis-login-title"> {i18next.t('login.title')} </h2>
				<p className="gneis-login-modal__subtitle"> {i18next.t('login.subtitle')} </p>

				<form className="gneis-login-modal__form" onSubmit={handleSubmit}>
					<label className="gneis-login-modal__label" htmlFor="gneis-login-user"> {i18next.t('login.username')} </label>
					<input
						autoComplete="username"
						className="gneis-login-modal__input"
						disabled={disabled}
						id="gneis-login-user"
						onChange={(event) => setUsername(event.target.value)}
						type="text"
						value={username}
					/>

					<label className="gneis-login-modal__label" htmlFor="gneis-login-pass"> {i18next.t('login.password')} </label>
					<input
						autoComplete="current-password"
						className="gneis-login-modal__input"
						disabled={disabled}
						id="gneis-login-pass"
						onChange={(event) => setPassword(event.target.value)}
						type="password"
						value={password}
					/>

					{error && (
						<p className="gneis-login-modal__error" role="alert"> {error} </p>
					)}

					<button
						className="gneis-login-modal__btn gneis-login-modal__btn--primary"
						disabled={disabled}
						type="submit"
					>
						{submitting ? i18next.t('login.loggingIn') : i18next.t('login.submit')}
					</button>
				</form>

				{allowGuest && (
					<button
						className="gneis-login-modal__btn gneis-login-modal__btn--guest"
						disabled={disabled}
						onClick={onGuest}
						type="button"
					>
						{i18next.t('login.guest')}
					</button>
				)}
			</div>
		</div>
	);
}
