import type { IAtomicChange } from "json-diff-ts";

import { atomizeChangeset, diff, type IChange } from "json-diff-ts";

import { isObject } from "./checkType.js";

export function getAtomizedChangeSet(existingData: object, newData: object) {
	const jsonDiff: IChange[] = diff(existingData, newData);

	return transformChangeset(atomizeChangeset(jsonDiff));
}

function transformChangeset(changeset: IAtomicChange[]) {
	const result: IAtomicChange[] = [];
	changeset.forEach((change) => {
		change.path = change.path.startsWith("$.") ? change.path.substring(2) : change.path;

		if (change.value && change.valueType === "Object" && isObject(change.value)) {
			change.path = change.path == "$" ? change.key : `${change.path}.${change.key}`;

			recursivelyExpandObjectChanges(change, result, change.path, change.value);
		} else {
			result.push(change);
		}
	});

	return result;
}

function recursivelyExpandObjectChanges(
	changeset: IAtomicChange,
	result: IAtomicChange[],
	path: string,
	value?: object
) {
	if (value) {
		Object.keys(value).forEach((key) => {
			const val = value[key as keyof typeof value] as object | undefined;
			const newPath = `${path}.${key}`;
			if (val && isObject(val)) {
				recursivelyExpandObjectChanges(changeset, result, newPath, val);
			} else {
				result.push({
					type: changeset.type,
					key: key,
					value: val,
					path: newPath,
					valueType: val?.constructor.name || "Object"
				});
			}
		});
	}
}
