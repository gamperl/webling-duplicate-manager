import { provide, inject, toRefs, reactive, Ref, InjectionKey } from '@vue/composition-api';

class Store {
	state: 'initialized' | 'authorizing' | 'fetching' | 'prepare' = 'initialized';
	domain: string = '';
	apikey: string = '';
	persistent: boolean = false
}

type StoreRefs = { [key in keyof Store]: Ref<Store[key]> };

const StoreKey: InjectionKey<StoreRefs> = Symbol('StoreKey');

export function provideStore() {
	const store = toRefs(reactive(new Store()));
	provide(StoreKey, store);
	return store;
}

export function useStore() {
	const store = inject(StoreKey, null);
	if (store === null) {
		throw new Error('Store is not available');
	}
	return store;
}
