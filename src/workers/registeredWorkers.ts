import workerpool from "workerpool";

import { factorial } from "./factorial.js";

const REGISTERED_WORKER_TASKS = workerpool.worker({
	factorial: factorial
});

export { REGISTERED_WORKER_TASKS };
