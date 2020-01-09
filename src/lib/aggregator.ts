import { inject, InjectionKey, provide, ref, Ref } from '@vue/composition-api';
import { IDefinition } from '@/lib/definitions';
import { IInstance, Instances } from './instances';
import { Formatter } from '@/lib/formatter';

export class Aggregator {
	public readonly aggregate: (instanceIds: number[], datatype: string, propertyIds: number[], key?: any) => Promise<Set<IInstance[]>>;
	public readonly hasAggregated: (key?: string) => Ref<boolean>;
	public readonly getAggregated: (key?: any) => Set<IInstance[]>;
	private readonly isAggregatedReady: Map<any, Ref<boolean>> = new Map();
	private readonly aggregated: Map<any, Set<IInstance[]>> = new Map();

	constructor(
		private instances: Instances,
		private fetchDefinition: (datatype: string) => Promise<IDefinition>
	) {
		this.aggregate = async (
			instanceIds, type, propertyIds, key = 'default'
		) => this.aggregateImpl(
			instanceIds, type, propertyIds, key
		);
		this.hasAggregated = (key = 'default') => this.hasAggregatedImpl(key);
		this.getAggregated = (key = 'default') => this.getAggregatedImpl(key);
	}

	private async aggregateImpl(instanceIds: number[], type: string, propertyIds: number[], key: string): Promise<Set<IInstance[]>> {
		this.initialize(key);
		this.isAggregatedReady.get(key)!.value = false;
		this.aggregated.get(key)!.clear();

		const instances = await Promise.all(instanceIds.map(instanceId => this.instances.fetchInstance(instanceId)));
		if (instances.some(instance => instance.type !== type)) {
			throw new Error('The instances have not te required type');
		}
		const definition = await this.fetchDefinition(type);
		const propertyGetters: ((instance: IInstance) => string)[] = propertyIds.map(propertyId => {
			const properties = definition.properties.filter(property => property.id === propertyId);
			if (properties.length !== 1) {
				throw new Error(`unknown Property ${propertyId}`);
			}
			return instance => Formatter.format(instance.properties[properties[0].title], properties[0].datatype);
		});
		const aggregated: Map<string, IInstance[]> = new Map();
		instances.forEach(instance => {
			if (propertyGetters.some(fn => fn(instance) !== '')) {
				const key: string = propertyGetters.map(fn => fn(instance)).join('<#>');
				if (aggregated.has(key)) {
					aggregated.get(key)!.push(instance);
				} else {
					aggregated.set(key, [instance]);
				}
			}
		});
		aggregated.forEach(values => {
			if (values.length > 1) {
				this.aggregated.get(key)!.add(values);
			}
		});
		this.isAggregatedReady.get(key)!.value = true;
		return this.aggregated.get(key)!;
	}

	private hasAggregatedImpl(key: string): Ref<boolean> {
		this.initialize(key);
		return this.isAggregatedReady.get(key)!;
	}

	private getAggregatedImpl(key: any): Set<IInstance[]> {
		this.initialize(key);
		return this.aggregated.get(key)!;
	}

	private initialize(key: string) {
		if (!this.isAggregatedReady.has(key)) {
			this.isAggregatedReady.set(key, ref(false));
		}
		if (!this.aggregated.has(key)) {
			this.aggregated.set(key, new Set());
		}
	}
}

const AggregatorKey: InjectionKey<Aggregator> = Symbol('AggregatorKey');

export function provideAggregator(instances: Instances, fetchDefinition: (datatype: string) => Promise<IDefinition>) {
	const aggregator = new Aggregator(instances, fetchDefinition);
	provide(AggregatorKey, aggregator);
	return aggregator;
}

export function useAggregator() {
	const aggregator = inject(AggregatorKey, null);
	if (aggregator === null) {
		throw new Error('Aggregator is not available');
	}
	return aggregator;
}
