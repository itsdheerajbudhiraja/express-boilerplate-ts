import type { UploadedDocument } from "../types/User.js";
import type { NextFunction, Request, Response } from "express";

import mmmagic from "mmmagic";
import multer from "multer";
import { parse } from "path";

import { BadRequest } from "../errors/ApiError.js";
import { logger } from "../winston_logger.js";

const { Magic, MAGIC_MIME_TYPE } = mmmagic;

export async function userProfilePicUploadMiddleware(
	req: Request,
	_res: Response,
	next: NextFunction
) {
	try {
		const required_docs = ["User_Profile_Pic"];

		const documents: UploadedDocument[] = [];

		await uploadFiles(req, required_docs);

		if (!req.files) {
			throw new BadRequest("No attached documents found");
		}

		// Check whether all required files are uploaded or not (of course with expected labels) and prepare documents info (name, content, extension).
		// Throws error if expected document is not uploaded.
		for (let i = 0; i < required_docs.length; i++) {
			const uploadedFiles = req.files as {
				[name: string]: Express.Multer.File[] | undefined;
			};

			let file = uploadedFiles[required_docs[i]]?.[0];
			let document = file?.buffer;

			if (!document) {
				if (uploadedFiles.documents) {
					file = uploadedFiles.documents.find((multerFile) => {
						return parse(multerFile.originalname).name == required_docs[i];
					});
					document = file?.buffer;
				}
			}

			if (!file || !document) {
				throw new BadRequest(`Required document : ${required_docs[i]} is not provided`);
			}

			// it is the safe check: whether the uploaded document content is really is that type of file extension. Example: image can't be uploaded with .pdf extension
			await validateDocumentMimeTypeAndSize(file);

			// uploaded document is okay. Add to the list that needs to be added to the user profile.

			documents.push({
				label: required_docs[i],
				content: document,
				fileExtension: parse(file.originalname).ext as UploadedDocument["fileExtension"]
			});
		}

		req.documents = documents;

		return next();
	} catch (err) {
		next(err);
	}
}

async function uploadFiles(req: Request, requiredFiles: string[]): Promise<void> {
	try {
		const fields = [{ name: "documents", maxCount: 5 }]; // if uploaded as 'documents' array then let's allow only 5 documents at the max.

		for (let i = 0; i < requiredFiles.length; i++) {
			fields.push({
				name: requiredFiles[i],
				maxCount: 1 // expecting only one file with allowed label
			});
		}

		const upload = multer({
			storage: multer.memoryStorage(),
			fileFilter: (_req, file, cb) => {
				if (
					file.mimetype == "image/jpeg" ||
					file.mimetype == "image/jpg" ||
					file.mimetype == "image/png" ||
					file.mimetype == "application/pdf"
				) {
					cb(null, true);
				} else {
					return cb(
						new BadRequest(
							"Only .png, .jpg, .jpeg and .pdf format allowed for document images but got: " +
								file.mimetype
						)
					);
				}
			},
			limits: {
				fileSize: process.env.DOCUMENT_GENERAL_MAX_SIZE * 1024
			}
		}).fields(fields); // file label should be either 'documents' or allowed label (ex: 'Passport_First_Page') for respective check

		return new Promise((resolve, reject) => {
			upload(req, req.res as Response, function (err) {
				if (err) {
					reject(new BadRequest("Failed to upload file, error: " + err.message));
				}
				resolve();
			});
		});
	} catch (err) {
		logger.error("Error occurred in upload: %o", err);
		throw new BadRequest("Failed to upload file, error: " + err);
	}
}

async function validateDocumentMimeTypeAndSize(file: Express.Multer.File) {
	const magic = new Magic(MAGIC_MIME_TYPE);

	await new Promise<void>((resolve, reject) => {
		magic.detect(file.buffer, (err, result) => {
			if (err as unknown) {
				reject(err);
			}
			if (file.mimetype != result) {
				reject(
					new BadRequest(
						`Document file validation failed. Please ensure document file content and extension are matching. Uploaded file content type: ${result} but file extension is: ${file.mimetype}`
					)
				);
			} else {
				resolve();
			}
		});
	});

	const jpegSizeLimit = process.env.DOCUMENT_JPEG_MAX_SIZE * 1024;
	const pngSizeLimit = process.env.DOCUMENT_PNG_MAX_SIZE * 1024;
	const pdfSizeLimit = process.env.DOCUMENT_PDF_MAX_SIZE * 1024;

	if (
		(file.mimetype == "image/jpeg" || file.mimetype == "image/jpg") &&
		file.size > jpegSizeLimit
	) {
		throw new BadRequest(
			`${file.originalname} file size is higher than allowed. Maximum allowed size of jpg/jpeg is ${process.env.DOCUMENT_JPEG_MAX_SIZE}KB. Uploaded file size is: ${Math.ceil(file.size / 1024)}KB`
		);
	} else if (file.mimetype == "image/png" && file.size > pngSizeLimit) {
		throw new BadRequest(
			`${file.originalname} file size is higher than allowed. Maximum allowed size of png is ${process.env.DOCUMENT_PNG_MAX_SIZE}KB. Uploaded file size is: ${Math.ceil(file.size / 1024)}KB`
		);
	} else if (file.mimetype == "application/pdf" && file.size > pdfSizeLimit) {
		throw new BadRequest(
			`${file.originalname} file size is higher than allowed. Maximum allowed size of pdf is ${process.env.DOCUMENT_PDF_MAX_SIZE}KB. Uploaded file size is: ${Math.ceil(file.size / 1024)}KB`
		);
	}
}
