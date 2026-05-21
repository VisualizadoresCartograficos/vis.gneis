import i18next from 'i18next';
import i18n from '@/app/languages/i18n';
// IMPORTANT! TO USE TRANSLATIONS, WE SET THEM LIKE: i18n.t('viewer.whatever');

import Utils from './Utils';


const INITIAL_CENTER = [-428106.86611520057, 4334472.25393817];
const PROJECTION = 'EPSG:3857';

export let mapjs;

export const initMap = async (block, unblock) => {
    block();
    const lang = window.localStorage.i18nextLng || 'es';
    window.IDEE.language.setLang(lang);
    i18next.changeLanguage(lang);

    let zoom = Utils.isMobile() ? 4 : 5;
    let center = INITIAL_CENTER;
    let mouseProjection = 'EPSG:4326';

    // PARSE THE GET PARAMETERS FROM THE URL
    if (window.location.search.length > 0) {
        const arrayParams = new URLSearchParams(window.location.search.replace('?', ''));
        zoom = arrayParams.get('zoom') || zoom;
        mouseProjection = arrayParams.get('srs') || mouseProjection;
        
        center = arrayParams.get('center') ? arrayParams.get('center').split(',').map(coord => parseFloat(coord)) : center;
        center = (center === INITIAL_CENTER) ? center : transform(center, mouseProjection, PROJECTION);
        
    }

    mapjs = window.IDEE.map({
        container: 'map',
        controls: Utils.isMobile() ? ['rotate', 'location'] : ['scale*true'],
        center: center,
        zoom: zoom,
        minZoom: Utils.isMobile() ? 3 : 5,
        maxZoom: 17
    });
    window.mapjs = mapjs;

    mapjs.getMapImpl().once('postrender', unblock());
}