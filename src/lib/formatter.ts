export class Formatter {
	public static format(value: any, datatype: string): string {
		switch (datatype) {
			case 'date':
				return Formatter.formatDate(value);
			default:
				return value;
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
		} else {
			return '';
		}
	}

	public static twoDigits(number: number): string {
		return (number < 10 ? '0' : '') + String(number);
	};
}
