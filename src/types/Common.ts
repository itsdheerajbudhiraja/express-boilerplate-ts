import type { AxiosRequestConfig } from "axios";

//? INFO: The applicable annotation's (for different datatypes) documentation is at: https://tsoa-community.github.io/docs/annotations.html

/**
 * @pattern ^[a-zA-Z0-9]{4,10}$ 'PIN Code' should be alpha numeric and should be between 4 to 10 characters.
 * @minLength 4 'PIN Code' should be minimum 4 chars
 * @maxLength 10 'PIN Code' should be less than 10 chars
 * @example "532845"
 */
export type PINCode = string;

/**
 * Stringified UUIDv4.
 * See [RFC 4112](https://tools.ietf.org/html/rfc4122)
 * @pattern ^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}$
 * @example "52907745-7672-470e-a803-a2f8feb52944"
 */
export type UUIDv4 = string;

/**
 * @pattern ^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$ Invalid Email format
 * @example "no-reply@diceid.com"
 */
export type Email = string;

/**
 * @pattern ^[+][(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$ Invalid Phone number format
 * @example "+919898989898"
 */
export type PhoneNo = string;

/**
 * @pattern ^[a-zA-Z][a-zA-Z\s]+$ Name should contain only alphabets (and spaces) and should be between 2 and 100 characters.
 * @minLength 2 Name should be minimum 2 chars
 * @maxLength 100 Name should be less than 100 chars
 * @example "John Doe"
 */
export type Name = string;

/**
 * References: https://www.iban.com/currency-codes, https://en.wikipedia.org/wiki/List_of_circulating_currencies
 * @uniqueItems Countries should be unique
 */
export type Currency =
	| "INR"
	| "USD"
	| "AUD"
	| "EUR"
	| "CAD"
	| "CNY"
	| "QAR"
	| "SAR"
	| "SGD"
	| "AED"
	| "GBP";

export type past_date = Date;

export type future_date = Date;

/**
 * @minimum 0 Page number should be greater or equal to 0
 * @isInt Page number should be integer
 */
export type PageNumber = number;

/**
 * @minimum 5 Page Size should be greater than 5
 * @maximum 100 Page Size should be lesser than 100
 * @isInt Page Size should be integer
 */
export type PageSize = number;

export type SortBy<T> = keyof Partial<T>;

export type SortOrder = "ASCENDING" | "DESCENDING";

export type PaginationParams<T> = {
	pageNo: PageNumber;
	pageSize: PageSize;
	sortBy: SortBy<T>;
	sortOrder: SortOrder;
};

/** This is to define the type which is not known. Example: nested json. */
export type GeneralNestedJSON = { [key: string]: unknown };

/** This is to capture errors during some validation/processing. */
export type Errors = { errors?: string[] };

/**
 * @pattern ^[0-9A-Fa-f]{64}$ SHA256 hash should be valid hexadecimal string
 * @maximum 64 SHA256 Hash should be 64 characters hex string
 * @minimum 64 SHA256 Hash should be 64 characters hex string
 * @example ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
 */
export type SHA256 = string;

export interface AxiosRetryConfig extends AxiosRequestConfig {
	maxRetries: number;
	retriedCount: number;
	retryExponentBase: number;
	deferredCount: number;
}
