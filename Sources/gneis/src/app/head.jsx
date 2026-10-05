/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable @next/next/inline-script-id */
import Script from 'next/script';

const API_IDEE = process.env.NEXT_PUBLIC_API_IDEE_URL;
const API_IDEE_PLUGINS = process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL;
/** Cache-buster: subir en cada deploy para forzar recarga de API-IDEE/plugins. */
const ASSET_V = process.env.NEXT_PUBLIC_ASSET_VERSION || '1';

/** @param {string} url */
const withVersion = (url) => {
	if (!url) {
		return url;
	}

	const sep = url.includes('?') ? '&' : '?';

	return `${url}${sep}v=${ASSET_V}`;
};

export default function CustomHeadImports() {
	return (
		<>
			<meta charSet="utf-8" />

			<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
			<meta name="mobile-web-app-capable" content="yes" />
			<meta name="mobile-web-app-status-bar-style" content="black-translucent" />

			<meta name="theme-color" content="#000000" />
			<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
			<meta httpEquiv="expires" content="no-cache" />
			<meta httpEquiv="pragma" content="no-cache" />
			<meta name="author" content="Centro Nacional de Información Geográfica" />
			<meta name="title" content={process.env.PAGE_TITLE} />
			<meta name="description" content="Un proyecto colaborativo de producción y publicación mediante servicios web de datos espaciales de cobertura nacional." />
			<meta name="keywords" content="Visualizadores, IDEE, Instituto Geográfico Nacional, IGN, Centro Nacional de Información Geográfica, CNIG, Eclipses, Sol, Luna, Astronomía, Mapas" />
			<meta name="rating" content="General" />
			<meta name="robots" content="FOLLOW,INDEX" />
			<meta name="revisit-after" content="1 weeks" />

			<title>{process.env.PAGE_TITLE}</title>

			{/* Open Graph */}
			<meta property="og:type" content="article" />
			<meta property="og:title" content={process.env.PAGE_TITLE} />
			<meta property="og:description" content={process.env.PAGE_TITLE} />
			<meta property="og:site_name" content={process.env.PAGE_TITLE} />
			<meta property="og:locale" content="es_ES" />

			{/* Twitter Card */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:site" content="@IGNSpain" />
			<meta name="twitter:creator" content="@IGNSpain" />

			{/* Geo Positioning */}
			<meta name="geo.region" content="ES-M" />
			<meta name="geo.placename" content="Madrid" />
			<meta name="geo.position" content="40.404460;-3.710000" />
			<meta name="ICBM" content="40.404460, -3.710000" />
			<meta name="DC.title" content={process.env.PAGE_TITLE} />

			{/* Favicon */}
			<link rel="shortcut icon" href="./favicon.ico" />

			{/* CSS Assets */}
			<link rel="stylesheet" href={withVersion(`${API_IDEE}/assets/css/apiidee.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/layerswitcher/layerswitcher.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/backimglayer/backimglayer.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/viewmanagement/viewmanagement.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/measurebar/measurebar.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/help/help.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/infocoordinates/infocoordinates.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/mousesrs/mousesrs.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/vectorsmanagement/vectorsmanagement.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/locator/locator.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/catalogmanager/catalogmanager.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion(`${API_IDEE_PLUGINS}/plugins/rastermanagement/rastermanagement.ol.min.css`)} />
			<link rel="stylesheet" href={withVersion('/gneis/css/pluginsGneis.css')} />
			<style>{`
             .m-panel.m-map-info.m-with-scale.opened.no-collapsible {
                order: 10 !important;
             }

             /* viewmanagement + help (BL): junto al panel de catalog cuando está abierto */
             .m-areas > .m-area.m-bottom.m-left {
                transition: left 0.25s ease;
             }
             @media only screen and (min-width: 769px) {
                .m-areas:has(.m-plugin-catalogmanager.opened) > .m-area.m-bottom.m-left {
                   left: calc(25vw + 0.5rem) !important;
                }
             }
            `}</style>

			{/* JS Assets */}
			{/* strategy="beforeInteractive" makes the project load the assets before rendering the front-end React App */}
			{/* API AND PLUGINS */}
			<Script src={withVersion(`${API_IDEE}/js/apiidee.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE}/js/configuration.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/layerswitcher/layerswitcher.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/backimglayer/backimglayer.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/viewmanagement/viewmanagement.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/measurebar/measurebar.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/help/help.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/infocoordinates/infocoordinates.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/mousesrs/mousesrs.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/vectorsmanagement/vectorsmanagement.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/locator/locator.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/catalogmanager/catalogmanager.ol.min.js`)} strategy="beforeInteractive" />
			<Script src={withVersion(`${API_IDEE_PLUGINS}/plugins/rastermanagement/rastermanagement.ol.min.js`)} strategy="beforeInteractive" />
		</>
	);
}
