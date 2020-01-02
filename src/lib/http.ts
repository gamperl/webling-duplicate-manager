import { inject, InjectionKey, provide, Ref, ref } from '@vue/composition-api';

export class Http {
	public readonly domain: Ref<string>;
	public readonly apikey: Ref<string>;
	public readonly getRequest: (url: string) => Promise<any>;
	public readonly postRequest: (url: string, data: any) => Promise<any>;
	public readonly putRequest: (url: string, data: any) => Promise<any>;
	public readonly deleteRequest: (url: string) => Promise<any>;

	constructor() {
		this.domain = ref('');
		this.apikey = ref('');
		this.getRequest = async url => this.send(url, 'GET');
		this.postRequest = async (url, data = null) => this.send(url, 'POST', data);
		this.putRequest = async (url, data = null) => this.send(url, 'PUT', data);
		this.deleteRequest = async url => this.send(url, 'DELETE');
	}

	private async send(relativeUrl: string, method: string, data: any = null): Promise<unknown> {
		if (this.domain.value.length === 0) {
			throw new Error('no apikey provided');
		}
		const url = `https://${this.domain.value}.webling.ch/api/1/${relativeUrl}`;

		if (this.apikey.value.length === 0) {
			throw new Error('no apikey provided');
		}

		if (['GET', 'POST', 'PUT', 'DELETE'].indexOf(method.toUpperCase()) === -1) {
			throw new Error(`Invalid method: ${method} for url: ${url}`);
		}

		const response: Response = await fetch(url, this.prepareRequest(method, data));

		if ([200, 201, 204].indexOf(response.status) > -1) {
			return this.onSuccess(url, method, data, response);
		} else {
			const formData = await this.serializeFormData(response, url, method, data);
			return this.onError(response.status, formData);
		}
	}

	private prepareRequest(method: string, data: any = null): RequestInit {
		const headers: Headers = new Headers();
		headers.append('apikey', this.apikey.value);

		if (method.toUpperCase() !== 'GET') {
			headers.append('Content-Type', 'application/x-www-form-urlencoded');
		}

		const init: RequestInit = {
			method: method,
			headers: headers,
			credentials: 'same-origin'
		};

		// if the data is a file object, send raw data
		if ('Blob' in window && data instanceof Blob) {
			init.body = data;
		} else if (['PUT', 'POST'].indexOf(method) > -1) {
			init.body = JSON.stringify(data);
		}

		return init;
	}

	private async onSuccess(url: string, method: string, data: any, response: Response): Promise<unknown> {
		// parse arguments if response text is not empty
		const responseText: string = await response.text();
		let responseJson: any = null;

		// the status 204 has always an empty response
		if (response.status === 204) {
			if (responseText.length > 0) {
				throw new Error(`Non empty response from ${method} ${url + (data ? ` data: ${data}` : '')}`);
			}
		} else {
			if (responseText.length === 0) {
				throw new Error(`Empty response from ${method} ${url + (data ? ` data: ${data}` : '')}`);
			}

			try {
				responseJson = JSON.parse(responseText);
			} catch (ex) {
				throw new Error(`Error parsing: ${responseText}`);
			}
		}

		return responseJson;
	}

	private async serializeFormData(response: Response, url: string, method: string, data: any): Promise<string> {
		let str: string = `${method} ${url}\n`;
		if (data) {
			str += `Data: ${JSON.stringify(data)} \n`;
		}
		const repsonseText: string = await response.text();
		if (repsonseText) {
			str += `Response Text: ${repsonseText}\n`;
		}
		response.headers.forEach((value, name) => {
			str += `${name}: ${value}\n`;
		});
		return str;
	}

	private onError(status: number, formData: string): never {
		switch (status) {

			// according to the w3c (http://www.w3.org/TR/XMLHttpRequest/#the-status-attribute)
			// a status code of 0 is a request failure
			case 0:
				throw new Error(`Request Failure with status 0: ${formData}`);

			case 401: // Unauthorized
				throw new Error(`Unauthorized: ${formData}`);

			case 404: // Not Found
				throw new Error(`Page not found: ${formData}`);

			case 425: // Quota Exceeded
				throw new Error(`Quota Exceeded: ${formData}`);

			case 500: // Internal Server Error
			case 501: // Not Implemented
				throw new Error(`Internal Server Error in: ${formData}`);

			case 502: // The nginix is not available
				throw new Error(`The nginix is not available: ${formData}`);

			case 503: // Deadlock occured or upgrade going on
				throw new Error(`Deadlock occured or upgrade going on: ${formData}`);

			default:
				throw new Error(`Unknown HTTP Status code (${status}): ${formData}`);
		}
	}
}

const HttpKey: InjectionKey<Http> = Symbol('HttpKey');

export function provideHttp() {
	const http = new Http();
	provide(HttpKey, http);
	return http;
}

export function useHttp() {
	const http = inject(HttpKey, null);
	if (http === null) {
		throw new Error('Store is not available');
	}
	return http;
}
