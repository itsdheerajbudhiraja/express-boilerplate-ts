class ValidationError extends Error {
	constructor(message: string) {
		super(message);

		// Set the prototype explicitly.
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

export { ValidationError };
