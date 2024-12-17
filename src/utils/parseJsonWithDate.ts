export function parseJsonWithDate<T>(record: string): T {
	const reDateDetect = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;

	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const resultObject = JSON.parse(record, (_key: any, value: any) => {
			if (typeof value == "string" && reDateDetect.exec(value)) {
				return new Date(value);
			}
			return value;
		});

		return resultObject as T;
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
	} catch (_err) {
		return record as T;
	}
}
