const metadata: WeakMap<Promise<unknown>, { active: boolean }> = new WeakMap();

export function isCancelable(promise: Promise<unknown>): boolean {
	return metadata.has(promise);
}

export function cancelable<T>(promise: Promise<T>): Promise<T> {
	if (isCancelable(promise)) {
		return promise;
	} else {
		metadata.set(promise, { active: true });
		return new Promise<T>((resolve, reject) => {
			promise
				.then(value => {
					if (metadata.get(promise)!.active) {
						resolve(value);
					}
				})
				.catch(reason => {
					if (metadata.get(promise)!.active) {
						reject(reason);
					}
				});
		});
	}
}

export function cancel(promise: Promise<unknown>): void {
	if (isCancelable(promise)) {
		metadata.get(promise)!.active = false;
	} else {
		throw new Error('Promise is not Cancelable');
	}
}
