export class Formatter {
	public static format(value: any, datatype: string): string {
		switch (datatype) {
			case 'date':
				return Formatter.formatDate(value);
			case 'timestamp':
				return Formatter.formatDateTime(value);
			case 'multienum':
				return Formatter.formatEnum(value);
			default:
				if (value === null) {
					return '';
				} else {
					return String(value);
				}
		}
	}

	public static formatDate(value: unknown): string {

		// if the value is saved as string representation, convert it back to date
		if (typeof value === 'string' && value.length > 0) {
			value = new Date(value);
		}

		// if value is a date, convert it to a string
		if (value instanceof Date && !isNaN(value.getTime())) {
			return Formatter.twoDigits(value.getDate()) + '.' +
				Formatter.twoDigits(value.getMonth() + 1) + '.' +
				Formatter.twoDigits(value.getFullYear());
		} else if (value === null) {
			return '';
		} else {
			return String(value);
		}
	}

	public static formatDateTime(value: unknown): string {

		// if the value is saved as string representation, convert it back
		if (typeof value === 'string' && value.length > 0) {
			value = new Date(value);
		}

		// if value is a date, convert it to a string
		if (value instanceof Date && !isNaN(value.getTime())) {
			return Formatter.twoDigits(value.getDate()) + '.' +
				Formatter.twoDigits(value.getMonth() + 1) + '.' +
				Formatter.twoDigits(value.getFullYear()) + ' ' +
				Formatter.twoDigits(value.getHours()) + ':' +
				Formatter.twoDigits(value.getMinutes()) + ':' +
				Formatter.twoDigits(value.getSeconds());
		} else if (value === null) {
			return '';
		} else {
			return String(value);
		}
	}

	public static formatEnum(value: unknown): string {
		if (Array.isArray(value)) {
			return value.join(', ');
		} else if (value === null) {
			return '';
		} else {
			return String(value);
		}
	}

	public static twoDigits(number: number): string {
		return (number < 10 ? '0' : '') + String(number);
	};
}
