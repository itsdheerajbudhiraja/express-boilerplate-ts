class EntityCollectionUndefinedError extends Error {
	constructor(message: string) {
		super(message);

		// Set the prototype explicitly.
		Object.setPrototypeOf(this, EntityCollectionUndefinedError.prototype);
	}
}

export { EntityCollectionUndefinedError };
