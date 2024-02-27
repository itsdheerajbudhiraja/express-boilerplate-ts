/**
 * Stringified UUIDv4.
 * See [RFC 4112](https://tools.ietf.org/html/rfc4122)
 * @pattern [0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-4[0-9A-Fa-f]{3}-[89ABab][0-9A-Fa-f]{3}-[0-9A-Fa-f]{12}
 * @example "52907745-7672-470e-a803-a2f8feb52944"
 */
export type UUIDv4 = string;

/**
 * @pattern ^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$ Invalid Email format
 * @example "no-reply@diceid.com"
 */
export type Email = string;

/**
 * @pattern ^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$ Invalid Phone number format
 * @example "+919898989898"
 */
export type PhoneNo = string;

/**
 * @pattern ^[A-Fa-f]{50}$ Name should contain only alphabets and should be less than 50 chars.
 * @maximum 50 Name should be less than 50 chars
 */
export type Name = string;
