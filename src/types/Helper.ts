export type OmitTimeStamps<T extends { created_at?: Date; updated_at?: Date }> = Omit<
	T,
	"created_at" | "updated_at"
>;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type MapKeysWithPrefix<T, P extends string> = {
	[K in keyof T & `${P}${string}`]: K;
};

export type FilterWithPrefix<T, P extends string> = {
	[K in keyof T as K extends `${P}${string}` ? K : never]: T[K];
};

export type Split<S extends string, D extends string> = string extends S
	? string[]
	: S extends ""
		? []
		: S extends `${infer T}${D}${infer U}`
			? [T, ...Split<U, D>]
			: [S];

export type Join<T extends unknown[], D extends string> = T extends []
	? ""
	: T extends [string | number]
		? `${T[0]}`
		: T extends [string | number, ...infer R]
			? `${T[0]}${D}${Join<R, D>}`
			: string;

export type Exact<T, S> = T extends S
	? Exclude<keyof T, keyof S> extends never
		? T
		: never
	: never;

export type SecondLevelKeys<T> = {
	[K in keyof T]: keyof T[K];
}[keyof T];

export type PrototypeKeys<T> = T extends { prototype: infer P }
	? keyof P
	: T extends object
		? { [K in keyof T]: PrototypeKeys<T[K]> }[keyof T]
		: never;

export type UnionToObject<T extends string> = {
	[P in T]: boolean;
};
export type TrimPrefix<T extends `${P}${string}`, P extends string> = T extends `${P}${infer K}`
	? K
	: never;
