/* eslint-disable @typescript-eslint/no-explicit-any */
function assignDefined(target: { [key: string]: any }, ...sources: { [key: string]: any }[]) {
	for (const source of sources) {
		for (const key of Object.keys(source)) {
			const val = source[key];
			if (val !== undefined) {
				target[key] = val;
			}
		}
	}
	for (const key of Object.keys(target)) {
		if (target[key] == undefined) {
			delete target[key];
		}
	}
	return target;
}

export { assignDefined };
