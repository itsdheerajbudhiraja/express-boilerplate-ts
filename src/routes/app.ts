import type { NextFunction, Request, Response } from "express";

import { AxiosError } from "axios";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import { slowDown } from "express-slow-down";
import helmet from "helmet";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import MongoosePkg from "mongoose";
import { Server } from "socket.io";
import { ValidateError } from "tsoa";

import { docsRouter } from "../controllers/Docs.js";
import { ApiError, Forbidden } from "../errors/ApiError.js";
import { ValidationError } from "../errors/ValidationError.js";
import {
	authenticateWebsocketConnectionForAdminUser,
	authenticateWebsocketConnectionForEndUser,
	type UserType
} from "../middlewares/authMiddleware.js";
import { responseMiddleware } from "../middlewares/responseMiddleware.js";
import { logger } from "../winston_logger.js";

import { RegisterRoutes } from "./routes.js";

const MongooseError = MongoosePkg.Error;

const app = express();

// Allow query parameters to be modified
// This is a workaround for the issue where query parameters are not writable in Express
app.use((req, res, next) => {
	Object.defineProperty(req, "query", {
		...Object.getOwnPropertyDescriptor(req, "query"),
		value: req.query,
		writable: true
	});
	next();
});

// Rate Limiting Middleware
const rateLimit = slowDown({
	windowMs: process.env.RATE_LIMIT_WINDOW_MS,
	delayAfter: process.env.RATE_LIMIT_MAX_REQUESTS,
	delayMs: (hits) => (hits - process.env.RATE_LIMIT_MAX_REQUESTS) * 100, // 100ms delay for each request over the limit
	maxDelayMs: 5000, // Maximum delay of 5 seconds
	validate: {
		trustProxy: process.env.TRUST_PROXY // Set to true if your app is behind a reverse proxy
	}
});
app.use(rateLimit);

// APIs will start here

if (process.env.TRUST_PROXY) {
	app.enable("trust proxy");
}

app.use(responseMiddleware);

app.use(
	cors({
		origin: function (origin, callback) {
			if (origin && process.env.CORS_ORIGIN.indexOf(origin) !== -1) {
				callback(null, true);
			} else if (origin && process.env.CORS_ORIGIN.indexOf("*") !== -1) {
				callback(null, true);
			} else {
				callback(null, false);
			}
		},
		credentials: true
	})
);

if (process.env.NODE_ENV == "production") {
	app.use(
		helmet({
			contentSecurityPolicy: {
				directives: {
					"script-src": ["'self'", "unpkg.com", "'unsafe-inline'"],
					"script-src-attr": ["'self'", "'unsafe-inline'"]
				}
			}
		})
	);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(mongoSanitize());

const demoLogger = (req: Request, res: Response, next: NextFunction) => {
	const method = req.method;
	const url = req.url;
	const ip = res.socket?.remoteAddress;
	const log = `${method} ${url} request from ${ip}, x-forwarded-for: ${req.headers["x-forwarded-for"]}, origin: ${req.headers["origin"]}`;
	logger.info(log);
	next();
};
app.use(demoLogger);

app.use("/docs", docsRouter);
RegisterRoutes(app);

/**
 * @openapi
 * /:
 *   get:
 *     summary: Retrieves the status of server
 *     tags:
 *       - health
 *     responses:
 *       "200":
 *         description: "Server is Up"
 *       "404":
 *         description: "Server is Down"
 */
app.get("/", (req: Request, res: Response) => {
	return res.send("OK");
});

// app.set("view engine", "ejs");
// app.set("views", path.join(dirName(import.meta), "../views"));
// app.use("/assets", express.static(path.join(dirName(import.meta), "../views/assets")));

app.use(function errorHandler(
	err: unknown,
	req: Request,
	res: Response,
	next: NextFunction
): Response | void {
	if (err instanceof ValidateError) {
		logger.error(`Validation Error occurred in ${req.path}: %o`, err.fields);
		return res.BAD_REQUEST("Validation Failed for field: " + JSON.stringify(err.fields));
	}
	if (err instanceof ValidationError) {
		logger.error(`Validation Error occurred in ${req.path}: %o`, err.message);
		return res.BAD_REQUEST("Validation Error: " + err.message);
	}
	if (err instanceof MongooseError) {
		logger.error(`Validation Error occurred in ${req.path}: %o`, err.message);
		return res.BAD_REQUEST(err.message);
	}
	if (err instanceof ApiError) {
		logger.error(`${err.name} occurred in ${req.path}: %o`, err.message);
		return res.FAILURE(`${err.message}`, err.statusCode);
	}
	if (err instanceof SyntaxError && "body" in err && "status" in err) {
		logger.error("Syntax error occurred: %o", err);
		return res.FAILURE(err.message, err.status as number);
	}
	if (err instanceof AxiosError) {
		logger.axiosErrorResponse("Axios error: %o", err);
		return res.INTERNAL_SERVER_ERROR(ReasonPhrases.INTERNAL_SERVER_ERROR);
	}
	if (err instanceof Error) {
		logger.error(`Error occurred in ${req.path}: %o`, err);
		return res.INTERNAL_SERVER_ERROR(ReasonPhrases.INTERNAL_SERVER_ERROR);
	}
	next();
});

app.use(function (req: Request, res: Response, next: NextFunction) {
	if (res.statusCode !== StatusCodes.NOT_FOUND) {
		return res.NOT_FOUND(
			`Can't ${req.method} '${req.url}'. Invalid API route. Please check route and try again`
		);
	}
	next();
});

let io: Server | undefined;

if (process.env.ENABLE_WEBSOCKET_SERVER) {
	io = new Server({
		cors: {
			origin: function (origin, callback) {
				if (origin && process.env.CORS_ORIGIN.indexOf(origin) !== -1) {
					callback(null, true);
				} else if (origin && process.env.CORS_ORIGIN.indexOf("*") !== -1) {
					callback(null, true);
				} else {
					callback(null, false);
				}
			},
			methods: ["GET", "POST"],
			credentials: true
		}
	});

	const namespace = io.of(/^\/bgv\/notifications\/(org|candidate)\/.*$/);

	namespace.use(async (socket, next) => {
		const nsp = socket.nsp.name.split("/");
		const type = nsp[3] as UserType;
		const id = nsp[4];

		try {
			switch (type) {
				case "end_user":
					await authenticateWebsocketConnectionForEndUser(id, socket.handshake.headers);
					break;

				case "admin_user": {
					await authenticateWebsocketConnectionForAdminUser(id, socket.handshake.headers);
					break;
				}
				default:
					throw new Forbidden("Invalid topic");
			}
		} catch (err) {
			logger.error("Error occurred in websocket authenticate middleware: %o", err);
			return next(new Error(err as string));
		}
		next();
	});

	namespace.on("connection", (socket) => {
		logger.debug("A user connected on socket id :  %o", socket.id);

		socket.on("disconnect", () => {
			logger.debug("User disconnected on socket id : %o", socket.id);
		});
	});
}

export { app, io };
