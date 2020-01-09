import { inject, InjectionKey, provide, reactive } from '@vue/composition-api';

export interface IDefinitionProperty {
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
}

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
	properties: IDefinitionProperty[];
}

export class Definitions {
	public readonly hasDefinition: (datatype: string) => boolean;
	public readonly fetchDefinition: (datatype: string) => Promise<IDefinition>;
	public readonly getDefinition: (datatype: string) => IDefinition;

	private readonly definitionCache: { [datatype: string]: IDefinition } = {};

	constructor(getRequest: (url: string) => Promise<any>) {
		this.hasDefinition = datatype => this.hasDefinitionImpl(datatype);
		this.fetchDefinition = async datatype => this.fetchDefinitionImpl(datatype, getRequest);
		this.getDefinition = datatype => this.getDefinitionImpl(datatype);
	}

	private hasDefinitionImpl(datatype: string): boolean {
		this.initialize(datatype);
		return this.definitionCache[datatype].ready;
	}

	private async fetchDefinitionImpl(datatype: string, getRequest: (url: string) => Promise<any>): Promise<IDefinition> {
		if (!this.hasDefinitionImpl(datatype)) {
			if (this.definitionCache[datatype].loaded === null) {
				this.load(datatype, getRequest);
			}
			await this.definitionCache[datatype].loaded;
		}
		return this.definitionCache[datatype];
	}

	private getDefinitionImpl(datatype: string): IDefinition {
		this.initialize(datatype);
		return this.definitionCache[datatype];
	}

	private load(datatype: string, getRequest: (url: string) => Promise<any>): void {
		this.definitionCache[datatype].loaded = getRequest(`definition/${datatype}`).then((definition: IDefinition) => {
			(<(keyof IDefinition)[]>Object.keys(definition)).forEach(key => {
				if (this.definitionCache[datatype].hasOwnProperty(key) && definition.hasOwnProperty(key)) {
					// @ts-ignore
					this.definitionCache[datatype][key] = definition[key];
				}
			});
			this.definitionCache[datatype].ready = true;
		});
	}

	private initialize(datatype: string): void {
		if (!this.definitionCache.hasOwnProperty(datatype)) {
			this.definitionCache[datatype] = reactive({
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
}

const DefinitionsKey: InjectionKey<Definitions> = Symbol('DefinitionsKey');

export function provideDefinitions(getRequest: (url: string) => Promise<any>) {
	const definitions = new Definitions(getRequest);
	provide(DefinitionsKey, definitions);
	return definitions;
}

export function useDefinitions() {
	const definitions = inject(DefinitionsKey, null);
	if (definitions === null) {
		throw new Error('Definitions are not available');
	}
	return definitions;
}
