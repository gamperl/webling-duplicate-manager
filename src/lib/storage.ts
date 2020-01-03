import { inject, InjectionKey, isRef, provide, ref, Ref } from '@vue/composition-api';

export class Storage {
	public readonly persistent: Ref<boolean>;
	public readonly getItem: (key: string, defaultValue: any) => any;
	public readonly setItem: (key: string, value: any) => void;
	public readonly clearItems: () => void;
	constructor() {
		this.persistent = ref(false);
		this.getItem = (key, defaultValue) => this.getItemImpl(key, defaultValue);
		this.setItem = (key, value) => this.setItemImpl(key, value);
		this.clearItems = () => this.clearItemsImpl();
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

	private clearItemsImpl(): void {
		for (let index: number = 0; index < localStorage.length; index += 1) {
			const key: string = localStorage.key(index)!;
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
