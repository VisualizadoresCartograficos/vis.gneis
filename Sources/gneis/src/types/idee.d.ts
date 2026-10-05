/**
 * API IDEE cargada por script externo (apiidee.ol.min.js).
 * @see src/app/head.jsx
 */
interface IIDeeLanguage {
	setLang(lang: string): void;
}

interface IIDeeMapOptions {
	container: string;
	controls?: string[];
	center?: number[];
	zoom?: number;
	minZoom?: number;
	maxZoom?: number;
}

interface IIDeeMapImpl {
	once(event: string, callback: () => void): void;
	updateSize?(): void;
}

interface IIDeeMap {
	getMapImpl(): IIDeeMapImpl;
}

interface IIDeeApi {
	language: IIDeeLanguage;
	config(key: string, value: unknown): void;
	map(options: IIDeeMapOptions): IIDeeMap;
}

interface OlProjApi {
	transform(coordinates: number[], fromProjection: string, toProjection: string): number[];
}

declare global {
	interface Window {
		IDEE: IIDeeApi;
		mapjs?: IIDeeMap;
		ol?: {
			proj?: OlProjApi;
		};
	}
}

export {};
