/* eslint-disable @next/next/no-page-custom-font */
/* eslint-disable @next/next/inline-script-id */
import Script from 'next/script';

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
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_URL}/assets/css/apiidee.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/layerswitcher/layerswitcher.ol.min.css`} />
            <link rel="stylesheet" href={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/backimglayer/backimglayer.ol.min.css`} />

            {/* JS Assets */}
            {/* strategy="beforeInteractive" makes the project load the assets before rendering the front-end React App */}
            {/* API AND PLUGINS */}
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_URL}/js/apiidee.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_URL}/js/configuration.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/layerswitcher/layerswitcher.ol.min.js`} strategy="beforeInteractive"></Script>
            <Script src={`${process.env.NEXT_PUBLIC_API_IDEE_PLUGINS_URL}/plugins/backimglayer/backimglayer.ol.min.js`} strategy="beforeInteractive"></Script>

            {/* ANALYTICS */}
            {/* 
            
            <meta name="google-site-verification" content="ISK5_ZcnAXEJIbCj7RnAFYGbEPPyiwlFq58BfGEEg28" />
            <Script async src="https://www.googletagmanager.com/gtag/js?id=" strategy="beforeInteractive" />
            <Script strategy="beforeInteractive">
                {`
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '');
`}
            </Script> 
            
            */}

        </>
    )
}