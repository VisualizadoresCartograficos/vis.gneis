import i18next from '@/app/languages/i18n';
import { installParentAuthOnCatalog, requestParentAuth } from './parentAuth';

import MAPA from '@/static/img/mapa.png';
import IMAGEN from '@/static/img/image.png';
import RASTER from '@/static/img/raster.png';
import HIBRIDO from '@/static/img/hibrido.png';
import HISTORICOS from '@/static/img/historicos.png';
import LIDAR from '@/static/img/lidar.png';
import OCUPACION from '@/static/img/ocupacion_suelo.png';
import CIUDADANO from '@/static/img/ciudadano.png';


const INITIAL_CENTER = [-428106.86611520057, 4334472.25393817];
const PROJECTION = 'EPSG:3857';
const portalUrl = process.env.NEXT_PUBLIC_GNEIS_PORTAL_URL;
const stacUrl = process.env.NEXT_PUBLIC_GNEIS_STAC_URL;

const MAP_CONTAINER_ID = 'map';

export let mapjs;

export const initMap = async (block, unblock, setMapStarted, sessionAuth) => {
	block();
	IDEE.language.setLang(window.localStorage.i18nextLng);
	let mouseProjection, center, zoom;

	// PARSE THE GET PARAMETERS FROM THE URL
	if (window.location.search.length > 0) {
		const arrayParams = new URLSearchParams(window.location.search.replace('?', ''));		
		zoom = arrayParams.get('zoom') && (!isNaN(arrayParams.get('zoom'))) ? parseInt(arrayParams.get('zoom'), 10) : (IDEE.config.MAP_VIEWER_ZOOM || 5);
		mouseProjection = arrayParams.get('srs') || PROJECTION;

		center = arrayParams?.get('center')?.split(',').map((coord) => parseFloat(coord)) || INITIAL_CENTER;
		if (center !== INITIAL_CENTER) {
			center = ol?.proj?.transform(coordinates, mouseProjection, PROJECTION);
		}
	}

	mapjs = IDEE.map({
		container: 'map',
		controls: ['attributions*<p><b>CC-BY 4.0</b>: <a style="color: #0000FF" href="https://www.scne.es" target="_blank">scne</a></p>', 'scale'],
		center: center,
		projection: mouseProjection,
		zoom: zoom,
		minZoom: 0,
		maxZoom: 20,
	});
	window.mapjs = mapjs;
	
	// Plugins

    const rastermanagement = new IDEE.plugin.RasterManagement({
		position: 'TR',
		order: 1
	});
	
	const layerswitcher = new IDEE.plugin.Layerswitcher({
		position: 'TR',
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
	
	const vectorsmanagement = new IDEE.plugin.VectorsManagement({
		position: 'TR',
		order: 3,
	});
	const backimglayer = new IDEE.plugin.BackImgLayer({
		position: 'TR',
		order: 4,
		layerId: 0,
		layerVisibility: true,
		collapsed: true,
		collapsible: true,
		columnsNumber: 4,
		empty: false,
		layerOpts: [{
			id: 'mapa',
			preview: MAPA.src,
			title: i18next.t('visor.street_map'),
			layers: [
			  new IDEE.layer.TMS({
				url: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseGris/{z}/{x}/{-y}.jpeg',
				name: 'IGNBaseGris',
				legend: i18next.t('visor.street_map'),
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
			preview: RASTER.src,
			title: i18next.t('visor.map'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://www.ign.es/wmts/mapa-raster?',
				name: 'MTN',
				legend: i18next.t('visor.map'),
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
			preview: IMAGEN.src,
			title: i18next.t('visor.image'),
			layers: [
			  new IDEE.layer.XYZ({
				url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
				name: 'PNOA-MA',
				legend: i18next.t('visor.image'),
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
			title: i18next.t('visor.hybrid'),
			preview: HIBRIDO.src,
			layers: [
			  new IDEE.layer.XYZ({
				url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
				name: 'PNOA-MA',
				legend: i18next.t('visor.image'),
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
				legend: i18next.t('visor.toponyms'),
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
			preview: LIDAR.src,
			title: i18next.t('visor.lidar'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://wmts-mapa-lidar.idee.es/lidar?',
				name: 'EL.GridCoverageDSM',
				legend: i18next.t('visor.lidar'),
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
			preview: OCUPACION.src,
			title: i18next.t('visor.corine'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
				name: 'LC.LandCoverSurfaces',
				legend: i18next.t('visor.corine'),
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
			preview: HISTORICOS.src,
			title: i18next.t('visor.historic'),
			layers: [
			  new IDEE.layer.WMTS({
				url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
				name: 'mtn50-edicion1',
				legend: i18next.t('visor.historic'),
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
			preview: CIUDADANO.src,
			title: i18next.t('visor.ciudadano'),
			layers: [
				new window.IDEE.layer.MapLibre({
					url: "https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json",
					name: "mapa_ciudadano",
					legend: i18next.t('visor.ciudadano'),
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

	const infocoordinates = new IDEE.plugin.Infocoordinates({
		position: 'TR',
		order: 5
	});

	IDEE.plugin.Locator.getJSONTranslations('es').search_direction = 'Población, municipio, provincia o CC. AA';
	IDEE.plugin.Locator.getJSONTranslations('en').search_direction = 'Locality, municipality, province or Autonomic Community';

	const locator = new IDEE.plugin.Locator({
		position: 'TC',
		tooltip: IDEE.plugin.Locator.getJSONTranslations(IDEE.language.getLang()).search_direction,
		byPlaceAddressPostal: {
			noProcess: 'carretera,expendeduria,ngbe,callejero,portal,toponimo,punto_recarga_electrica',
		},
		byParcelCadastre: false,
		byCoordinates: false,
	});

	const mousesrs = new IDEE.plugin.MouseSRS();

	const measurebar = new IDEE.plugin.MeasureBar({
		position: 'BR'
	});

	const viewmanagement = new IDEE.plugin.ViewManagement({
		position: 'BL',
		predefinedZoom: [
		  {
			name: 'Zoom Inicial',
			center: [-428106.86611520057, 4334472.25393817],
			zoom: zoom,
		  }]
	});
	
	const help = new IDEE.plugin.Help({
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

	/*****************/
	/* PLUGIN GNEIS */
	/*****************/
		// sessionAuth !== undefined → standalone (login / invitado / sesión restaurada)
		// undefined → embebido: pedir token al padre
		const parentAuth = sessionAuth ? sessionAuth : await requestParentAuth();
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

	
	mapjs.addPlugins([viewmanagement, measurebar, rastermanagement, layerswitcher, help, infocoordinates, mousesrs, vectorsmanagement, backimglayer, catalogmanager, locator]);


	mapjs.once('postrender', () => {
		setMapStarted();
		unblock();
	});

	// Si el mapa no renderiza (contenedor 0x0 / error OL), no dejar el loader eterno.
	window.setTimeout(unblock, 3000);
};