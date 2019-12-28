import { inject, InjectionKey, provide, reactive } from '@vue/composition-api';
import { Http } from '@/lib/http';

export interface IDefinition {
	ready: boolean;
	loaded: Promise<void> | null;
	children: string[];
	label: string[];
	links: {[category: string]: string};
	ordered: boolean;
	parents: string|null;
	categories: {
		id: number;
		title: string;
		properties: number[];
	}[];
	properties: {
		title: string;
		datatype: string;
		type: string|null;
		id: number;
		values?: {
			id: number;
			value: string;
			color: string;
		}[] | null;
		default: any;
	}[];
}

interface IDefinitionCache {
	[datatype: string]: IDefinition
}

function initialize(definitions: IDefinitionCache, datatype: string): void {
	if (!definitions.hasOwnProperty(datatype)) {
		definitions[datatype] = reactive({
			ready: false,
			loaded: null,
			children: [],
			label: [],
			links: {},
			ordered: false,
			parents: null,
			categories: [],
			properties: []
		});
	}
}

export class Definitions {
	public readonly fetch: (datatype: string) => Promise<IDefinition>;
	public readonly has: (datatype: string) => boolean;
	public readonly get: (datatype: string) => IDefinition;
	constructor(http: Http) {
		const definitionCache: { [datatype: string]: IDefinition } = {};
		this.has = (datatype: string): boolean => {
			initialize(definitionCache, datatype);
			return definitionCache[datatype].ready;
		};
		this.fetch = async datatype => {
			initialize(definitionCache, datatype);
			if (!definitionCache[datatype].ready) {
				if (definitionCache[datatype].loaded === null) {
					definitionCache[datatype].loaded = http.get(`definition/${datatype}`).then((definition: IDefinition) => {
						(<(keyof IDefinition)[]>Object.keys(definition)).forEach(key => {
							if (definitionCache[datatype].hasOwnProperty(key) && definition.hasOwnProperty(key)) {
								// @ts-ignore
								definitionCache[datatype][key] = definition[key];
							}
						});
						definitionCache[datatype].ready = true;
					});
				}
				await definitionCache[datatype].loaded;
			}
			return definitionCache[datatype];
		};
		this.get = datatype => {
			initialize(definitionCache, datatype);
			return definitionCache[datatype];
		};
	}
}

const DefinitionsKey: InjectionKey<Definitions> = Symbol('DefinitionsKey');

export function provideDefinitionss(http: Http) {
	const definitions = new Definitions(http);
	provide(DefinitionsKey, definitions);
	return definitions;
}

export function useDefinitionss() {
	const definitions = inject(DefinitionsKey, null);
	if (definitions === null) {
		throw new Error('Definitions are not available');
	}
	return definitions;
}
