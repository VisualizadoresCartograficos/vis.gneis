'use client';
import { Component, Fragment } from 'react';
import { withTranslation } from 'react-i18next';
import i18n from '@/app/languages/i18n';

import './Header.css';

import MINISTERIO from '@/assets/logos/logo_ministerio.png';
import IGN from '@/assets/logos/logo_ign.png';

class Header extends Component {

  constructor(props) {
    super(props);
    this.state = {
      langSelected: window.localStorage.i18nextLng || 'es',
    };
  }

  changeLanguage = (lang) => {
    this.setState({ langSelected: lang }, () => {
      i18next.changeLanguage(lang); // This changes the language in i18next, which is used for translations (e.g., i18n.t('header.title'))
      window.IDEE.language.setLang(lang); // This changes the language in the API-IDEE, but we need to implement an event trigger (e.g., mapjs.on('change_language', ()=>{})) to render the plugins
    });
  }

  navigate = () => {
    window.location.href = '/gneis';
  }

  goToIGN = () => {
    window.open('https://www.ign.es/web/ign/portal');
  }

  render() {
    const { langSelected } = this.state;

    return (<Fragment>
      <header className='h-desktop'>
        <div id='header-content'>
          <div className='logos'>
            <div id='ministerio'>
              <img src={MINISTERIO.src} alt='Logo' />
            </div>
            <div id='ign'>
              <img src={IGN.src} onClick={this.goToIGN} alt='Logo' />
            </div>
          </div>
          <div id='right-section'>
            <label id='title' style={{ fontSize: window.innerWidth <= process.env.NEXT_PUBLIC_SMARTHPHONE_WIDTH ? '18px' : '16px' }}>{i18n.t('header.title')}</label>
            <div id='languages'>
              <span className={langSelected === 'es' ? 'lang-selected' : 'lang-option'} onClick={this.changeLanguage.bind(null, 'es')}>es</span>
              <span className={langSelected === 'en' ? 'lang-selected' : 'lang-option'} onClick={this.changeLanguage.bind(null, 'en')}>en</span>
            </div>
          </div>
        </div>
      </header>
    </Fragment>);
  }
}

export default withTranslation()(Header);
