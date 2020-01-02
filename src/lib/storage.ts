import { inject, InjectionKey, isRef, provide, ref, Ref } from '@vue/composition-api';

export class Storage {
	public readonly persistent: Ref<boolean>;
	public readonly getItem: (key: string, defaultValue: any) => any;
	public readonly setItem: (key: string, value: any) => void;
	constructor() {
		this.persistent = ref(false);
		this.getItem = (key, defaultValue) => this.getItemImpl(key, defaultValue);
		this.setItem = (key: string, value: any) => this.setItemImpl(key, value);
	}

	private getItemImpl(key: string, defaultValue: any): any {
		const value = localStorage.getItem(key);
		if (typeof value === 'string') {
			try {
				return JSON.parse(value);
			} catch (e) {}
		}
		return isRef(defaultValue) ? defaultValue.value : defaultValue;
	};

	private setItemImpl(key: string, value: any): void {
		if (this.persistent.value) {
			localStorage.setItem(key, JSON.stringify(isRef(value) ? value.value : value));
		} else {
			localStorage.removeItem(key);
		}
	};
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
