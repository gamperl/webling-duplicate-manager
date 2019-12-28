import { inject, InjectionKey, isRef, provide, ref, Ref } from '@vue/composition-api';

export class Storage {
	public readonly persistent: Ref<boolean>;
	public readonly get: (key: string, defaultValue: any) => any;
	public readonly set: (key: string, value: any) => void;
	constructor() {
		this.persistent = ref(false);
		this.get = (key, defaultValue) => {
			const value = localStorage.getItem(key);
			if (typeof value === 'string') {
				try {
					return JSON.parse(value);
				} catch (e) {}
			}
			return isRef(defaultValue) ? defaultValue.value : defaultValue;
		};
		this.set = (key, value) => {
			if (this.persistent.value) {
				localStorage.setItem(key, JSON.stringify(isRef(value) ? value.value : value));
			} else {
				localStorage.removeItem(key);
			}
		};
	}
}

const StorageKey: InjectionKey<Storage> = Symbol('StorageKey');

export function provideStorage() {
	const storage = new Storage();
	provide(StorageKey, storage);
	return storage;
}

export function useStorage() {
	const storage = inject(StorageKey, null);
	if (storage === null) {
		throw new Error('Storage is not available');
	}
	return storage;
}
