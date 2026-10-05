import i18next from 'i18next';
import i18n from '@/app/languages/i18n';
// IMPORTANT! TO USE TRANSLATIONS, WE SET THEM LIKE: i18n.t('viewer.whatever');

import Utils from './Utils';
import {
	installParentAuthOnCatalog,
	requestParentAuth,
} from './parentAuth';
import { applyViewerLanguage, resolveViewerLanguage } from './locale';

import MAPA from 'static/img/mapa.png';
import IMAGEN from 'static/img/image.png';
import RASTER from 'static/img/raster.png';
import HIBRIDO from 'static/img/hibrido.png';
import HISTORICOS from 'static/img/historicos.png';
import LIDAR from 'static/img/lidar.png';
import OCUPACION from 'static/img/ocupacion_suelo.png';
import CIUDADANO from 'static/img/ciudadano.png';

const MAPA_SRC = MAPA.src;
const IMAGEN_SRC = IMAGEN.src;
const RASTER_SRC = RASTER.src;
const HIBRIDO_SRC = HIBRIDO.src;
const HISTORICOS_SRC = HISTORICOS.src;
const LIDAR_SRC = LIDAR.src;
const OCUPACION_SRC = OCUPACION.src;
const CIUDADANO_SRC = CIUDADANO.src;

const INITIAL_CENTER = [-428106.86611520057, 4334472.25393817];
const PROJECTION = 'EPSG:3857';

export let mapjs;

const transformCoordinates = (coordinates, fromProjection, toProjection) => {
	if (window.ol?.proj?.transform) {
		return window.ol.proj.transform(coordinates, fromProjection, toProjection);
	}
	return coordinates;
};

const disableTerrainForOpenLayers = () => {
	if (window.IDEE?.config) {
		window.IDEE.config('terrain', { default: '' });
	}
};

const MAP_CONTAINER_ID = 'map';

const getMapContainer = () => document.getElementById(MAP_CONTAINER_ID);

const hasMapContainerArea = (el = getMapContainer()) =>
	Boolean(el && el.clientWidth > 0 && el.clientHeight > 0);

/**
 * Espera a que #map tenga área real (evita updateSize/render de OL con 0x0,
 * típico al embeber en iframe de Liferay).
 */
const waitForMapContainerLayout = (timeoutMs = 5000) =>
	new Promise((resolve) => {
		const el = getMapContainer();

		if (hasMapContainerArea(el)) {
			requestAnimationFrame(() => {
				requestAnimationFrame(resolve);
			});
			return;
		}

		let settled = false;
		let observer = null;
		let timeoutId = 0;

		const finish = () => {
			if (settled) {
				return;
			}

			settled = true;
			window.clearTimeout(timeoutId);
			window.removeEventListener('resize', onResize);

			if (observer) {
				observer.disconnect();
			}

			resolve();
		};

		const tryReady = () => {
			if (hasMapContainerArea()) {
				requestAnimationFrame(() => {
					requestAnimationFrame(finish);
				});
			}
		};

		const onResize = () => {
			tryReady();
		};

		if (typeof ResizeObserver !== 'undefined' && el) {
			observer = new ResizeObserver(tryReady);
			observer.observe(el);

			if (el.parentElement) {
				observer.observe(el.parentElement);
			}
		}

		window.addEventListener('resize', onResize);
		timeoutId = window.setTimeout(finish, timeoutMs);
		tryReady();
	});

const safeUpdateMapSize = (mapImpl) => {
	if (!mapImpl?.updateSize || !hasMapContainerArea()) {
		return false;
	}

	try {
		mapImpl.updateSize();
		return true;
	}
	catch (err) {
		console.warn('[Visor:initMap] updateSize falló', err);
		return false;
	}
};

/**
 * Sincroniza el tamaño del mapa cuando el contenedor gana área (iframe / layout).
 */
const scheduleMapSizeSync = (mapImpl) => {
	if (!mapImpl?.updateSize) {
		return;
	}

	const run = () => {
		safeUpdateMapSize(mapImpl);
	};

	run();
	requestAnimationFrame(run);

	const el = getMapContainer();

	if (typeof ResizeObserver !== 'undefined' && el) {
		const observer = new ResizeObserver(run);

		observer.observe(el);

		if (el.parentElement) {
			observer.observe(el.parentElement);
		}
	}

	window.addEventListener('resize', run);
};
export const initMap = async (block, unblock, sessionAuth) => {
	block();
	applyViewerLanguage(resolveViewerLanguage());

	let zoom = IDEE.config.MAP_VIEWER_ZOOM || 5;
	let center = INITIAL_CENTER;
	let mouseProjection = 'EPSG:4326';

	// PARSE THE GET PARAMETERS FROM THE URL
	if (window.location.search.length > 0) {
		const arrayParams = new URLSearchParams(window.location.search.replace('?', ''));
		const zoomParam = arrayParams.get('zoom');
		if (zoomParam !== null) {
			zoom = parseInt(zoomParam, 10) || zoom;
		}
		mouseProjection = arrayParams.get('srs') || mouseProjection;

		center = arrayParams.get('center')
			? arrayParams.get('center').split(',').map((coord) => parseFloat(coord))
			: center;
		center = center === INITIAL_CENTER
			? center
			: transformCoordinates(center, mouseProjection, PROJECTION);
	}

	disableTerrainForOpenLayers();
	await waitForMapContainerLayout();

	mapjs = window.IDEE.map({
		container: 'map',
		// controls: Utils.isMobile() ? ['rotate', 'location'] : ['scale*true'],
		controls: ['attributions*<p><b>CC-BY 4.0</b>: <a style="color: #0000FF" href="https://www.scne.es" target="_blank">scne</a></p>', 'scale'],
		center: center,
		zoom: zoom,
		minZoom: 0,
		maxZoom: 20,
	});
	window.mapjs = mapjs;
	const portalUrl = process.env.NEXT_PUBLIC_GNEIS_PORTAL_URL;
	// Plugins
    const viewmanagement = new window.IDEE.plugin.ViewManagement({
		position: 'BL',
		predefinedZoom: [
		  {
			name: 'Zoom Inicial',
			center: [-428106.86611520057, 4334472.25393817],
			zoom: zoom,
		  }]
	});

    const measurebar = new window.IDEE.plugin.MeasureBar({
		position: 'BR'
	});

    const rastermanagement = new window.IDEE.plugin.RasterManagement({
		position: 'TR',
		order: 1
	});

	const layerswitcher = new window.IDEE.plugin.Layerswitcher({
		order: 2,
		precharged: {
			groups: [{
			  name: 'Cartografía',
			  services: [{
				type: 'WMTS',
				name: 'Mapas',
				url: 'https://www.ign.es/wmts/mapa-raster?',
			  }, {
				type: 'WMTS',
				name: 'Callejero ',
				url: 'https://www.ign.es/wmts/ign-base?',
			  }, {
				type: 'WMS',
				name: 'Cuadrículas Mapa Topográfico Nacional',
				url: 'https://www.ign.es/wms-inspire/cuadriculas?',
			  }],
			},
			{
			  name: 'Imágenes',
			  services: [{
				type: 'WMTS',
				name: 'Ortofotos máxima actualidad PNOA',
				url: 'https://www.ign.es/wmts/pnoa-ma?',
			  }, {
				type: 'WMS',
				name: 'Mosaicos de satélite',
				url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
			  },],
			},
			{
			  name: 'Información geográfica de referencia y temática',
			  services: [{
				type: 'WMS',
				name: 'Catastro ',
				url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
			  }, {
				type: 'WMS',
				name: 'Unidades administrativas',
				url: ' https://www.ign.es/wms-inspire/unidades-administrativas?',
			  }, {
				type: 'WMS',
				name: 'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)',
				url: 'https://www.ign.es/wms-inspire/ngbe?',
			  }, {
				type: 'WMS',
				name: 'Redes de transporte',
				url: 'https://servicios.idee.es/wms-inspire/transportes?',
			  }, {
				type: 'WMS',
				name: 'Hidrografía ',
				url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
			  }, {
				type: 'WMTS',
				name: 'Ocupación del suelo (Corine y SIOSE)',
				url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
			  }, ],
			},
			{
			  name: 'Modelos digitales de elevaciones',
			  services: [{
				type: 'WMTS',
				name: 'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)',
				url: 'https://wmts-mapa-lidar.idee.es/lidar?',
			  }, {
				type: 'WMTS',
				name: 'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)',
				url: 'https://servicios.idee.es/wmts/mdt?',
				white_list: ['EL.ElevationGridCoverage'],
			  }, {
				type: 'WMS',
				name: 'Curvas de nivel y puntos acotados',
				url: 'https://servicios.idee.es/wms-inspire/mdt?',
				white_list: ['EL.ContourLine', 'EL.SpotElevation'],
			  }],
			}],
		  }		  
	});

	const help = new window.IDEE.plugin.Help({
		position: 'BL',
		header: {
			title: 'Visualizador GNEIS',
		},
		initialExtraContents: {
			es: [{
				title: 'Introducción',
				content: `<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Introducción</h2><div>
El GeoNodo Español de Imágenes Satelitales (GNEIS) es el punto de acceso del <strong>Instituto Geográfico Nacional (IGN)</strong> a datos e imágenes de satélite de cobertura nacional e internacional. Se trata de un proyecto insignia del Plan Nacional de Teledetección (PNT), constituyendo la infraestructura nacional de referencia en materia de imágenes satelitales sobre el territorio español. Más información en <a href="https://gneis.ign.es/" target="_blank">GNEIS</a> y <a href="https://pnt.ign.es" target="_blank">PNT</a>.</br>
Desde este visualizador puedes explorar el territorio, consultar catálogos STAC, superponer capas cartográficas y trabajar con distintas fuentes de información geográfica de forma inmediata. </br>
El acceso es abierto y gratuito con perfil general. Las Administraciones Públicas disponen de un acceso ampliado con más capacidades y datos.</br></br>
<strong>Acceso y perfiles:</strong></br>
<ul>
	<li><strong>Perfil general:</strong> acceso abierto y gratuito a la exploración del territorio y a los datos e imágenes disponibles para el público.</li>
	<li><strong>Administraciones Públicas:</strong> acceso ampliado con mayores capacidades y contenidos adicionales según los permisos asignados.</li>
</ul>
Si necesitas más información sobre el servicio o los perfiles de acceso, consulta los recursos del Instituto Geográfico Nacional y de la IDEE.
				</div></div>`,
			}],
			en: [{
				title: 'Introduction',
				content: `<div><h2 style="text-align: center; color: #fff; background-color: #364b5f; padding: 8px 10px;">Introduction</h2><div>
				The Spanish GeoNode for Satellite Images (GNEIS) is the access point for the <strong>National Geographic Institute (IGN)</strong> to national and international satellite image data. It is a flagship project of the National Plan for Teledetection (PNT), constituting the national reference infrastructure in the field of satellite images over the Spanish territory. More information at <a href="https://gneis.ign.es/" target="_blank">GNEIS</a> and <a href="https://pnt.ign.es" target="_blank">PNT</a>.</br>
From this viewer you can explore the territory, consult STAC catalogs, superimpose cartographic layers and work with different geographic information sources immediately.</br>
The access is open and free with general profile. Public Administrations have an extended access with more capabilities and data.</br></br>
<strong>Access and profiles:</strong></br>
<ul>
	<li><strong>General profile:</strong> open and free access to explore the territory and the data and images available for the public.</li>
	<li><strong>Public Administrations:</strong> extended access with more capabilities and additional content according to the assigned permissions.</li>
</ul>
If you need more information about the service or the access profiles, consult the resources of the <strong>National Geographic Institute</strong> and the <strong>IDEE</strong>.
				</div></div>`,
			}],
		},
		finalExtraContents: {
			es: [{
				title: 'Mas información',
				content: `<iframe src="${portalUrl}/es/footer" title="Pie GNEIS" style="width:100%;border:0;height:calc(100vh - 90px)"></iframe>`
			}],
			en: [{
				title: 'More information',
				content: `<iframe src="${portalUrl}/en/footer" title="Footer GNEIS" style="width:100%;border:0;height:calc(100vh - 90px)"></iframe>`
			}],
		}
	});
	const infocoordinates = new window.IDEE.plugin.Infocoordinates({
		position: 'TR',
		order: 5
	});
	const mousesrs = new window.IDEE.plugin.MouseSRS();
	const vectorsmanagement = new window.IDEE.plugin.VectorsManagement({
		order: 3,
	});
	const backimglayer = new window.IDEE.plugin.BackImgLayer({
		order: 4,
		position: 'TR',
		layerId: 0,
		layerVisibility: true,
		collapsed: true,
		collapsible: true,
		columnsNumber: 4,
		empty: false,
		layerOpts: [{
			id: 'mapa',
			preview: MAPA_SRC,
			title: i18n.t('visor.street_map'),
			layers: [
			  new IDEE.layer.TMS({
				url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseGris/{z}/{x}/{-y}.jpeg',
				name: 'IGNBaseGris',
				legend: i18n.t('visor.street_map'),
				matrixSet: 'GoogleMapsCompatible',
				isBase: true,
				displayInLayerSwitcher: false,
				queryable: false,
				tileGridMaxZoom: 17,
			  },{
					displayInLayerSwitcher: false,
				}),
			],
		  }, {
			id: 'raster',
			preview: RASTER_SRC,
			title: i18n.t('visor.map'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://www.ign.es/wmts/mapa-raster?',
				name: 'MTN',
				legend: i18n.t('visor.map'),
				matrixSet: 'GoogleMapsCompatible',
				isBase: true,
				displayInLayerSwitcher: false,
				queryable: false,
				visible: true,
				format: 'image/jpeg',
			  },{displayInLayerSwitcher: false}),
			],
		  },
		  {
			id: 'imagen',
			preview: IMAGEN_SRC,
			title: i18n.t('visor.image'),
			layers: [
			  new IDEE.layer.XYZ({
				url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
				name: 'PNOA-MA',
				legend: i18n.t('visor.image'),
				projection: 'EPSG:3857',
				isBase: true,
				displayInLayerSwitcher: false,
				queryable: false,
				visible: true,
				tileGridMaxZoom: 19,
			  }),
			],
		  },
		  {
			id: 'hibrido',
			title: i18n.t('visor.hybrid'),
			preview: HIBRIDO_SRC,
			layers: [
			  new IDEE.layer.XYZ({
				url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
				name: 'PNOA-MA',
				legend: i18n.t('visor.image'),
				projection: 'EPSG:3857',
				isBase: true,
				displayInLayerSwitcher: false,
				queryable: false,
				visible: true,
				tileGridMaxZoom: 19,
			  }),
			  new IDEE.layer.WMTS({
				url: 'https://www.ign.es/wmts/ign-base?',
				name: 'IGNBaseOrto',
				matrixSet: 'GoogleMapsCompatible',
				legend: i18n.t('visor.toponyms'),
				transparent: true,
				displayInLayerSwitcher: false,
				queryable: false,
				visible: true,
				format: 'image/png',
			  },{displayInLayerSwitcher: false}),
			],
		  },
		  {
			id: 'lidar',
			preview: LIDAR_SRC,
			title: i18n.t('visor.lidar'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://wmts-mapa-lidar.idee.es/lidar?',
				name: 'EL.GridCoverageDSM',
				legend: i18n.t('visor.lidar'),
				matrixSet: 'GoogleMapsCompatible',
				isBase: true,
				displayInLayerSwitcher: false,
				queryable: false,
				visible: true,
				format: 'image/png',
			  },{displayInLayerSwitcher: false}),
			],
		  },
		  {
			id: 'ocupacion-suelo',
			preview: OCUPACION_SRC,
			title: i18n.t('visor.corine'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
				name: 'LC.LandCoverSurfaces',
				legend: i18n.t('visor.corine'),
				matrixSet: 'GoogleMapsCompatible',
				isBase: true,
				displayInLayerSwitcher: false,
				queryable: false,
				visible: true,
				format: 'image/png',
			  },{displayInLayerSwitcher: false}),
			],
		  },
		  {
			id: 'historicos',
			preview: HISTORICOS_SRC,
			title: i18n.t('visor.historic'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
				name: 'mtn50-edicion1',
				legend: i18n.t('visor.historic'),
				matrixSet: 'GoogleMapsCompatible',
				isBase: true,
				displayInLayerSwitcher: false,
				queryable: false,
				visible: true,
				format: 'image/jpeg',
			  },{displayInLayerSwitcher: false}),
			],
		  }, {
			id: 'ciudadano',
			preview: CIUDADANO_SRC,
			title: i18n.t('visor.ciudadano'),
			layers: [
				new window.IDEE.layer.MapLibre({
					url: "https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json",
					name: "mapa_ciudadano",
					legend: i18n.t('visor.ciudadano'),
					isBase: true,
					displayInLayerSwitcher: false,
					queryable: false,
					visible: true,
					format: "image/jpeg"
				},{
					displayInLayerSwitcher: false
				}),
			]
		  }
		]
	});

	const stacUrl = process.env.NEXT_PUBLIC_GNEIS_STAC_URL;
	// sessionAuth !== undefined → standalone (login / invitado / sesión restaurada)
	// undefined → embebido: pedir token al padre
	const parentAuth =
		sessionAuth !== undefined ? sessionAuth : await requestParentAuth();
	const hasToken = !!parentAuth?.access_token;

	console.info('[Visor:initMap] parentAuth resultado', {
		hasAccessToken: hasToken,
		hasRefreshToken: !!parentAuth?.refresh_token,
		standalone: sessionAuth !== undefined,
	});

	installParentAuthOnCatalog(parentAuth);

	// STAC/descarga públicos; el listado filtrado (solo públicas vs públicas+suyas)
	// lo resuelve Liferay según haya o no token.
	const gneisCatalog = {
		title: 'GNEIS',
		url: stacUrl,
		collectionsUrl: `${portalUrl}/o/custom-auth/collections`,
		public: !hasToken,
	};

	if (hasToken) {
		gneisCatalog.authUrl = `${portalUrl}/o/custom-auth/token`;
	}

	const catalogmanager = new window.IDEE.plugin.Catalogmanager({
		addCatalogEnabled: false,
		downloadUrl: process.env.NEXT_PUBLIC_GNEIS_DOWNLOAD_URL,
		collapsed: false,
		position: 'TL',
		predefinedCatalogs: [gneisCatalog]
	});

	IDEE.plugin.Locator.getJSONTranslations('es').search_direction = 'Población, municipio, provincia o CC. AA';
	IDEE.plugin.Locator.getJSONTranslations('en').search_direction = 'Locality, municipality, province or Autonomic Community';

	const locator = new window.IDEE.plugin.Locator({
		position: 'TC',
		tooltip: IDEE.plugin.Locator.getJSONTranslations(IDEE.language.getLang()).search_direction,
		byPlaceAddressPostal: {
			noProcess: 'carretera,expendeduria,ngbe,callejero,portal,toponimo,punto_recarga_electrica',
		},
		byParcelCadastre: false,
		byCoordinates: false,
	});
	mapjs.addPlugins([viewmanagement, measurebar, rastermanagement, layerswitcher, help, infocoordinates, mousesrs, vectorsmanagement, backimglayer, catalogmanager, locator]);

	const mapImpl = mapjs.getMapImpl();

	scheduleMapSizeSync(mapImpl);

	let unblocked = false;
	const safeUnblock = () => {
		if (unblocked) {
			return;
		}

		unblocked = true;
		unblock();
	};

	try {
		if (mapImpl?.once) {
			mapImpl.once('postrender', () => {
				safeUpdateMapSize(mapImpl);
				safeUnblock();
			});
		}
		else {
			safeUnblock();
		}
	}
	catch (err) {
		console.warn('[Visor:initMap] once(postrender) falló', err);
		safeUnblock();
	}

	// Si el mapa no renderiza (contenedor 0x0 / error OL), no dejar el loader eterno.
	window.setTimeout(safeUnblock, 3000);
};