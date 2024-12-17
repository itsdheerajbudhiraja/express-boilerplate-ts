/* eslint-disable @typescript-eslint/no-explicit-any */
import lodash from "lodash";

import { isObject } from "./checkType.js";

const { get, cloneDeep } = lodash;

export function getObjectKeysMatchingWildcard(obj: any, key: string) {
	const keysToReturn: string[] = [];
	getAllKeysMatchingWildcard(obj, key, keysToReturn);

	return keysToReturn;
}

function getAllKeysMatchingWildcard(
	obj: any,
	key: string,
	keysToReturn: string[],
	previousPath?: string
) {
	if (!isObject(obj)) {
		previousPath && keysToReturn.push(previousPath);
		return;
	}
	const keyParts = key.split(".");

	const currentPart = keyParts.splice(0, 1)[0];

	let newPath = "";
	let newObj;

	if (currentPart == "*") {
		const dataKeys = Object.keys(obj);
		dataKeys.forEach((dataKey) => {
			newObj = cloneDeep(obj);
			newPath = previousPath ? `${previousPath}.${dataKey}` : currentPart;
			newObj = get(newObj, dataKey);

			if (newObj) {
				getAllKeysMatchingWildcard(newObj, keyParts.join("."), keysToReturn, newPath);
			} else if (previousPath) {
				keysToReturn.push(previousPath);
			}
		});
		return;
	}

	newPath = previousPath ? `${previousPath}.${currentPart}` : currentPart;

	newObj = cloneDeep(obj);
	newObj = get(newObj, currentPart);

	if (newObj) {
		if (keyParts.length) {
			getAllKeysMatchingWildcard(newObj, keyParts.join("."), keysToReturn, newPath);
			return;
		}
		keysToReturn.push(newPath);
	}
}
