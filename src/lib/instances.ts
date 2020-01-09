import { inject, InjectionKey, provide, reactive } from '@vue/composition-api';
import { Definitions, IDefinition } from '@/lib/definitions';

export interface IInstanceBase {
	ready: boolean;
	loaded: Promise<void> | null;
	id: number;
	type: string;
	readonly: boolean;
	label: string;
	meta: { [key: string]: any };
	children: { [childType: string]: number[] };
	links: { [linkCategory: string]: number[] };
	parents: number[] | null;
}

export interface IRawInstance extends IInstanceBase {
	properties: { [propertyId: number]: any };
}

export interface IInstance extends IInstanceBase {
	properties: { [propertyName: string]: any };
}

interface IQueueItem {
	instanceId: number;
	resolve(): void;
}

export class Instances {
	public readonly hasInstance: (instanceId: number) => boolean;
	public readonly fetchInstance: (instanceId: number) => Promise<IInstance>;
	public readonly getInstance: (instanceId: number) => IInstance;

	private readonly instanceCache: { [instanceId: number]: IInstance } = {};
	private readonly queue: IQueueItem[] = [];
	private scheduled: boolean = false;

	constructor(
		private getRequest: (url: string) => Promise<any>,
		private definitions: Definitions
	) {
		this.hasInstance = instanceId => this.hasInstanceImpl(instanceId);
		this.fetchInstance = async instanceId => this.fetchInstanceImpl(instanceId);
		this.getInstance = instanceId => this.getInstanceImpl(instanceId);
	}

	private hasInstanceImpl(instanceId: number): boolean {
		this.initialize(instanceId);
		return this.instanceCache[instanceId].ready;
	}

	private async fetchInstanceImpl(instanceId: number): Promise<IInstance> {
		if (!this.hasInstance(instanceId)) {
			if (this.instanceCache[instanceId].loaded === null) {
				this.load(instanceId);
			}
			await this.instanceCache[instanceId].loaded;
		}
		return this.instanceCache[instanceId];
	};

	private getInstanceImpl(instanceId: number): IInstance {
		this.initialize(instanceId);
		return this.instanceCache[instanceId];
	};

	private load(instanceId: number) {
		if (!this.scheduled) {
			setTimeout(() => this.flush(), 1);
			this.scheduled = true;
		}
		this.instanceCache[instanceId].loaded = new Promise(resolve => {
			this.queue.push({ instanceId, resolve });
		});
	}

	private flush(): void {
		const fetchedQueue: Map<number, () => void> = new Map();
		const instanceIds: number[] = [];
		this.queue
			.splice(0, 256)
			.forEach(item => {
				fetchedQueue.set(item.instanceId, item.resolve);
				instanceIds.push(item.instanceId);
			});

		if (this.queue.length > 0) {
			this.flush();
		} else {
			this.scheduled = false;
		}

		if (instanceIds.length === 1) {
			this.getRequest(`object/${instanceIds[0]}`).then((rawInstance: IRawInstance) => {
				rawInstance.id = instanceIds[0];
				this.provide([rawInstance], fetchedQueue);
			});
		} else {
			this.getRequest(`object/${instanceIds.join(',')}`).then((rawInstances: IRawInstance[]) => {
				this.provide(rawInstances, fetchedQueue);
			});
		}
	}

	private provide(rawInstances: IRawInstance[], fetchedQueue: Map<number, () => void>): void {
		rawInstances.forEach(async rawInstance => {
			await this.update(rawInstance, fetchedQueue.get(rawInstance.id)!);
		});
	}

	private async update(rawInstance: IRawInstance, fetchDone: () => void): Promise<void> {
		if (!this.definitions.hasDefinition(rawInstance.type)) {
			await this.definitions.fetchDefinition(rawInstance.type);
		}

		const instance = this.instanceCache[rawInstance.id];
		instance.ready = true;
		instance.type = rawInstance.type;
		instance.label = '';
		instance.readonly = rawInstance.readonly;
		instance.meta = {
			created: this.convertTimestamp(rawInstance.meta.created),
			lastmodified: this.convertTimestamp(rawInstance.meta.lastmodified),
			...instance.meta
		};
		instance.properties = {};
		instance.parents = rawInstance.parents;
		instance.children = rawInstance.children;
		instance.links = rawInstance.links;

		// update the properties
		const definitions: IDefinition = this.definitions.getDefinition(rawInstance.type);
		definitions.properties.forEach(property => {

			// convert date and timestamp to Date objects
			if (rawInstance.properties.hasOwnProperty(String(property.id))) {
				const value: any = rawInstance.properties[property.id];

				// the template value or the payment data are objects in the interface but stirngs in the backend
				if (
					(rawInstance.type === 'template' && property.title === 'value') ||
					(rawInstance.type === 'payment' && property.title === 'data') ||
					(rawInstance.type === 'email' && property.title === 'recipients') ||
					(rawInstance.type === 'email' && property.title === 'emailFields')
				) {
					instance.properties[property.title] = value === null ? null : JSON.parse(String(value));

				} else {

					// data and timestamps are provided as string, but date easyer to handle as Date objects
					switch (property.datatype) {

						case 'date':
							instance.properties[property.title] = this.convertDate(String(value));
							break;

						case 'timestamp':
							instance.properties[property.title] = this.convertTimestamp(String(value));
							break;

						case 'image':
						case 'file':
						case 'binary':
							if (typeof value === 'object' && value !== null) {
								value.lastmodified = this.convertTimestamp(
									String(rawInstance.properties[property.id].lastmodified)
								);
								instance.properties[property.title] = value;
							} else {
								instance.properties[property.title] = null;
							}
							break;

						default:
							instance.properties[property.title] = value;
					}
				}
			} else {
				instance.properties[property.title] = property.default;
			}
		});

		instance.label = definitions.label
			.map(name => instance.properties[name])
			.filter(value => value !== null && String(value).length > 0)
			.join(' ');

		fetchDone();
	}

	private convertDate(data: string): Date | null {
		const match: RegExpMatchArray | null = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
		if (match === null) {
			return null;
		} else {
			return new Date(
				parseInt(match[1], 10),
				parseInt(match[2], 10) - 1,
				parseInt(match[3], 10)
			);
		}
	}

	private convertTimestamp(data: string): Date | null {
		const match: RegExpMatchArray | null = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(data);
		if (match === null) {
			return null;
		} else {
			return new Date(
				parseInt(match[1], 10),
				parseInt(match[2], 10) - 1,
				parseInt(match[3], 10),
				parseInt(match[4], 10),
				parseInt(match[5], 10),
				parseInt(match[6], 10)
			);
		}
	}

	private initialize(instanceId: number): void {
		if (!this.instanceCache.hasOwnProperty(instanceId)) {
			this.instanceCache[instanceId] = reactive({
				ready: false,
				loaded: null,
				id: instanceId,
				type: '',
				readonly: true,
				label: '',
				meta: {},
				properties: {},
				children: {},
				links: {},
				parents: null
			});
		}
	}
}

const InstancesKey: InjectionKey<Instances> = Symbol('InstancesKey');

export function provideInstances(getRequest: (url: string) => Promise<any>, definitions: Definitions) {
	const instances = new Instances(getRequest, definitions);
	provide(InstancesKey, instances);
	return instances;
}

export function useInstances() {
	const instances = inject(InstancesKey, null);
	if (instances === null) {
		throw new Error('Instances is not available');
	}
	return instances;
}
