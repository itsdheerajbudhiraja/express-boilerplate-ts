# NodeJS Express Boilerplate

Boilerplate for NodeJS Express Projects written in Typescript

The purpose of this template repository is to fast track APIs development and reach to production ASAP.

At most places except [TSOA](https://tsoa-community.github.io/docs/), there is very less use of external dependency injection or similar libraries to demonstrate how same thing can be achieved in vanilla code. The advantage of this is more control on behavior of dependency injection.

It is designed keeping `SOLID Principles` and `Loose Coupling` in mind. It demonstrates use of Singleton (like db, auth etc), Factory(cache), Strategy(injecting dependency based on .env like DB_TYPE) design patterns at multiple places.

## Features

- Controllers written using TSOA library
- Controllers, Services, Middlewares, Entities, Error handlers all are pre-configured with standard best practices and follows SOLID Principles, loose coupled Architecture
- Mongo Database with extensible database interface for other Databases implementation
- Redis Persistent Queue with extensible interface for other Queues implementation
- NodeCache support with extensible interface for other Cache implementation
- Rust Web assembly boilerplate for compute intensive tasks
- Worker pool for running compute intensive tasks in worker threads
- Standard utilities for validation, email sender are available
- Automatic Swagger generation - combined swagger is generated from swagger docs and tsoa generated swagger specs
- Eslint and Prettier configured for Code quality checks
- Husky configured to run pre commit git hooks to run code quality checks

## Project Structure

- `src/index.ts` This is entry point of project when we do `npm start`.
- `src/controllers` This serves as entrypoint of different APIs
- `src/auth` This contains extensible Auth interface and JWT Auth Implementation for that interface
- `src/middlewares` This contains middlewares that are executed before reaching code flow to controllers
- `src/errors` Custom error types
- `src/db` This contains extensible Database interface and MongoDB implementation
- `src/models` This contains model validation using mongoose schema. Mostly `tsoa` is capable of doing basic validation based on type but sometimes we need some conditional validation logic and we need custom validators.
- `src/configs` This contains configuration files
- `src/entities` This contains entity cum repository classes. Repository methods are implemented in Entities itself as static methods
- `src/services` This is executed from controllers and contains main business logic for each API
- `src/types` This contains types of different objects used across application
- `src/typings` This extends express namespace for custom properties in request/response
- `src/utils` This contains common utilities
- `src/workers` This implements workerpool and worker tasks to execute in worker threads
- `src/p_queue` This contains extensible Persistent Queue interface and Redis Pub/Sub implementation
- `src/cache` This contains extensible application cache and Implementation of Node Cache
- `src/__tests__` This contains unit and integration test cases
- `rust-wasm-libs` This contains web assembly code for simple factorial example
- `keys` This contains blank `privateKey.pem` and `publicKey.pem` used by JWT auth implementation. One needs to put actual RSA keys in those files before running the application or test cases.
- `Dockerfile` To dockerize the application
- `Dockerfile.rust-wasm` To dockerize the application with Rust and other dependencies if rust web assembly is used
- `swagger.json` Generated from `tsoa` and Swagger comments in the code
- `.env` This contains environment variables referred in the code
- `tsoa.json` Configuration file for `tsoa`
- `tsconfig.json` Configuration file for typescript
- `jest.config.ts` Configuration file for `Jest Test Runner`

## PreRequisites

1. NodeJs >= v18.17.1

## Steps to run

Install npm modules:

```bash
npm install
```

Rust web assembly code is written in `rust-wasm-libs` directory. To compile wasm package Run:

```bash
npm run build-rust-wasm
```

If not using rust web assembly, remove `rust-wasm-libs` from `package.json` and run `npm install` again.
Start application:

```bash
npm start
```

To Run with different env file (e.g. `.env.local`):

```bash
ENV_FILE=.env.local npm start
```

To run test cases:

```bash
ENV_FILE=.env.test npm run test
```

### Dockerize the application

Only NodeJS without rust wasm:

```bash
docker build . -t <image-repo>/<image-tag> --platform linux/amd64
```

With rust wasm:

```bash
docker build . -f Dockerfile.rust-wasm -t <image-repo>/<image-tag> --platform linux/amd64
```

### Using rust in app

To use `src/workers/factorial.ts` (rust wasm) - use following snippet into `src/routes/app.ts`

```js
// Imports
import { createOrGetPool } from "../workers/workerPool.js";
import { Promise as WorkerPromise } from "workerpool";

// Wasm Route
app.get("/wasm/:n", async (req: Request, res: Response) => {
 try {
  const factorial = await createOrGetPool({
   workerFileName: "factorial"
  })
   .exec("factorial", [req.params.n])
   .timeout(10000);
  return res.OK(factorial.toString());
 } catch (err) {
  logger.error(`Error occurred in ${req.path}: %o`, err);
  if (err instanceof WorkerPromise.TimeoutError) {
   return res.BAD_REQUEST("Operation timeout because of large input. Try smaller input");
  }
  return res.INTERNAL_SERVER_ERROR((err as Error).message);
 }
});
```

### Clean up rust wasm if not using

```bash
rm -rf rust-wasm-libs src/workers/factorial.ts Dockerfile.rust-wasm 
```

Delete `"rust-wasm-libs": "file:rust-wasm-libs/pkg"` dependency and `build-rust-wasm` task from `package.json` file.
