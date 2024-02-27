function isObject(obj: object) {
	return obj.constructor == Object;
}

function isArray(obj: object) {
	return obj.constructor == Array;
}

function isObjectOrArray(obj: object) {
	return isObject(obj) || isArray(obj);
}

function isBoolean(obj: object) {
	return obj.constructor == Boolean;
}

function isFunction(obj: object) {
	return obj.constructor == Function;
}

function isNumber(obj: object) {
	return obj.constructor == Number;
}

function isString(obj: object) {
	return obj.constructor == String;
}

function isInstanced(obj: object) {
	if (isArray(obj)) {
		return false;
	}
	if (isBoolean(obj)) {
		return false;
	}
	if (isFunction(obj)) {
		return false;
	}
	if (isNumber(obj)) {
		return false;
	}
	if (isObject(obj)) {
		return false;
	}
	if (isString(obj)) {
		return false;
	}

	return true;
}

export {
	isArray,
	isBoolean,
	isFunction,
	isInstanced,
	isNumber,
	isObject,
	isObjectOrArray,
	isString
};
