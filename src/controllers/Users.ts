import type { User } from "../entities/User.js";
import type { ApiSuccessResponse, ApiFailureResponse } from "../types/ApiResponse.js";

import express from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import multer from "multer";
import {
	Body,
	Controller,
	Get,
	OperationId,
	Path,
	Post,
	Query,
	Route,
	Security,
	SuccessResponse,
	Tags,
	Response,
	Request,
	Middlewares
} from "tsoa";

import { BadRequest } from "../errors/ApiError.js";
import { ApiAuthType } from "../middlewares/authMiddleware.js";
import { userProfilePicUploadMiddleware } from "../middlewares/userProfilePicUploadMiddleware.js";
import { successResponse } from "../responses/successResponse.js";
import { UsersService } from "../services/Users.js";
import { UserCreationParams, type UploadedDocument } from "../types/User.js";
import { logger } from "../winston_logger.js";

@Route("/users")
@Security(ApiAuthType.API_KEY)
@Tags("Users")
@Response<ApiFailureResponse>(StatusCodes.BAD_REQUEST, ReasonPhrases.BAD_REQUEST)
@Response<ApiFailureResponse>(StatusCodes.UNAUTHORIZED, ReasonPhrases.UNAUTHORIZED)
@Response<ApiFailureResponse>(StatusCodes.FORBIDDEN, ReasonPhrases.FORBIDDEN)
@Response<ApiFailureResponse>(
	StatusCodes.INTERNAL_SERVER_ERROR,
	ReasonPhrases.INTERNAL_SERVER_ERROR
)
/** User CRUD Operations */
export class UsersController extends Controller {
	/** Create new user in database */
	@SuccessResponse(StatusCodes.CREATED) // Custom success response
	@Post()
	@OperationId("CreateUser")
	public async createUser(
		@Body() requestBody: UserCreationParams
	): Promise<ApiSuccessResponse<User>> {
		this.setStatus(201); // set return status 201
		return successResponse(await new UsersService().create(requestBody));
	}

	@Post("/image/{userId}")
	@OperationId("SetUserProfilePic")
	@Middlewares(userProfilePicUploadMiddleware)
	/**
	 * @openapi
	 * /users/image/{userId}:
	 *  post:
	 *      requestBody:
	 *          content:
	 *              multipart/form-data:
	 *                  schema:
	 *                      type: object
	 *                      properties:
	 *                          User_Profile_Pic:
	 *                              type: string
	 *                              format: base64
	 *
	 */
	public async setUserProfilePic(
		@Path("userId") userId: string,
		@Request() request: express.Request
	): Promise<ApiSuccessResponse<User>> {
		const documents = request.documents as UploadedDocument[];

		const userProfilePic = documents.find((doc) => {
			return doc.label == "User_Profile_Pic";
		});

		if (!userProfilePic?.content) {
			throw new BadRequest("File not uploaded or some error occurred during upload");
		}
		const imageBase64 = userProfilePic.content.toString("base64");

		return successResponse(await new UsersService().updateProfilePic(userId, imageBase64));
	}

	/** Retrieves all users from database */
	@Get()
	@OperationId("GetAllUsers")
	public async getUser(): Promise<ApiSuccessResponse<{ content: User[]; total_elements: number }>> {
		return successResponse(await new UsersService().getAllUsers());
	}

	/** Retrieves user by id from database */
	@Get("{userId}")
	@OperationId("GetUserById")
	public async getUserById(
		@Path() userId: string,
		@Query() name?: string
	): Promise<ApiSuccessResponse<User>> {
		return successResponse(await new UsersService().getUserById(userId, name));
	}

	private async uploadFile(req: express.Request): Promise<void> {
		try {
			const upload = multer({
				storage: multer.memoryStorage(),
				fileFilter: (_req, file, cb) => {
					if (
						file.mimetype == "image/jpeg" ||
						file.mimetype == "image/jpg" ||
						file.mimetype == "image/png" ||
						file.mimetype == "image/svg+xml"
					) {
						cb(null, true);
					} else {
						cb(null, false);
						return cb(
							new BadRequest(
								"Only .png, .jpg, .jpeg and .svg format allowed for template image but got: " +
									file.mimetype
							)
						);
					}
				},
				limits: {
					fileSize: 2048 * 1024
				}
			}).single("userProfilePic");
			return new Promise((resolve, reject) => {
				upload(req, req.res as express.Response, function (err) {
					if (err instanceof multer.MulterError) {
						throw new BadRequest("Failed to upload file, error: " + err.message);
					} else if (err) {
						reject(err);
					}
					resolve();
				});
			});
		} catch (err) {
			logger.error("Error occurred in upload: %o", err);
			if (err instanceof multer.MulterError) {
				throw new BadRequest("Failed to upload file, error: " + err.message);
			}
			throw err;
		}
	}
}
