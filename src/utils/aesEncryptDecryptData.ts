import crypto from "crypto";
import lodash from "lodash";

import { isObjectOrArray } from "./checkType.js";
import { parseJsonWithDate } from "./parseJsonWithDate.js";

const { set, cloneDeep, get } = lodash;

/**
 *
 * @param data Data to encrypt
 * @param key base64 formatted 32 byte encryption key
 * @param iv base64 formatted 16 byte initial vector
 * @returns encrypted text
 */
export function encrypt(data: string | number | boolean | object, key: string, iv?: string) {
	const aesKey = Buffer.from(key, "base64");
	const aesIv = iv != undefined ? Buffer.from(iv, "base64") : crypto.randomBytes(16);

	const cipher = crypto.createCipheriv("aes-256-cbc", aesKey, aesIv);
	let encrypted = cipher.update(encodeData(data));
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return { encrypted_data: encrypted.toString("hex"), iv: aesIv.toString("base64") };
}

/**
 *
 * @param data Data to decrypt
 * @param key base64 formatted 32 bytes encryption key
 * @param iv base64 formatted 16 byte initial vector
 * @returns decrypted text
 */
export function decrypt(data: string, key: string, iv: string) {
	const aesKey = Buffer.from(key, "base64");
	const aesIv = Buffer.from(iv, "base64");

	const encryptedText = Buffer.from(data, "hex");
	const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, aesIv);

	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decodeData(decrypted.toString());
}

function encodeData(data: string | number | boolean | object) {
	const dataType = typeof data;
	let encoded;
	switch (dataType) {
		case "string":
			encoded = `s:${data}`;
			break;
		case "number":
			encoded = `n:${data}`;
			break;
		case "boolean":
			encoded = `b:${data}`;
			break;
		case "object":
			if (data instanceof Date) {
				encoded = `d:${data.toISOString()}`;
			} else {
				encoded = `o:${JSON.stringify(data)}`;
			}
			break;
		default:
			throw new Error("Unsupported data type");
	}
	return encoded;
}

function decodeData(encodedData: string) {
	if (encodedData[1] != ":") {
		return encodedData;
	}
	const type = encodedData.substring(0, 2);
	const value = encodedData.substring(2);
	switch (type) {
		case "s:":
			return value;
		case "n:":
			return Number(value);
		case "b:":
			return value === "true";
		case "d:":
			return new Date(value);
		case "o:":
			return parseJsonWithDate(value);
		default:
			throw new Error("Unsupported data type");
	}
}

export function encryptData(data: string | number | object, dataKey: string, iv?: string) {
	const dataToEncrypt = cloneDeep(data);
	let dataToReturn = cloneDeep(data);
	const aesIv = iv || crypto.randomBytes(16).toString("base64");

	if (isObjectOrArray(dataToEncrypt as object)) {
		recursiveEncryptData(dataToReturn as object, dataKey, aesIv);
	} else {
		const encryptionResult = encrypt(dataToEncrypt.toString(), dataKey, aesIv);
		dataToReturn = encryptionResult.encrypted_data;
	}

	return { encrypted_data: dataToReturn, iv: aesIv };
}

function recursiveEncryptData(data: object, dataKey: string, iv: string, path?: string) {
	const dataToEncrypt = path ? get(data, path.split(".")) : data;

	Object.entries(dataToEncrypt).map(([key, value]) => {
		if (value) {
			const pathToEncrypt = path ? path + `.${key}` : key;

			if (isObjectOrArray(value as object)) {
				recursiveEncryptData(data, dataKey, iv, pathToEncrypt);
			} else {
				set(data, pathToEncrypt || key, encrypt(value, dataKey, iv).encrypted_data);
			}
		}
	});
}

export function decryptData(data: string | object, dataKey: string, iv?: string) {
	const dataToDecrypt = cloneDeep(data);
	let dataToReturn = cloneDeep(data) as unknown;
	const aesIv = iv || crypto.randomBytes(16).toString("base64");

	if (typeof dataToDecrypt == "string") {
		dataToReturn = decrypt(dataToDecrypt.toString(), dataKey, aesIv);
	} else if (isObjectOrArray(dataToDecrypt as object)) {
		recursiveDecryptData(dataToReturn as object, dataKey, aesIv);
	} else {
		throw new Error(`Can not decrypt data. Unsupported data type: ${typeof data}`);
	}

	return dataToReturn;
}

function recursiveDecryptData(data: object, dataKey: string, iv: string, path?: string) {
	const dataToDecrypt = path ? get(data, path.split(".")) : data;

	Object.entries(dataToDecrypt).map(([key, value]) => {
		if (value) {
			const pathToDecrypt = path ? path + `.${key}` : key;

			if (isObjectOrArray(value as object)) {
				recursiveDecryptData(data, dataKey, iv, pathToDecrypt);
			} else {
				set(data, pathToDecrypt || key, decrypt(value.toString(), dataKey, iv));
			}
		}
	});
}
