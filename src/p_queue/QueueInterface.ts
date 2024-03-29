/* eslint-disable @typescript-eslint/no-explicit-any */
interface QueueInterface<T> {
	instance?: T;
	stopSubscribers: boolean;
	getInstance?(): T;
	connect(): Promise<any>;
	disconnect(): Promise<any>;
	publish(queueName: string, data: string): Promise<any>;
	subscribe(
		queueName: string,
		callback?: (message: any, err?: Error) => Promise<void>
	): Promise<any>;
	getCurrentQueueLength(queueName: string): Promise<number>;
}

export { QueueInterface };
