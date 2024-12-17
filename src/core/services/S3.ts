import {
	AbortMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	CreateMultipartUploadCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	S3Client,
	UploadPartCommand,
	ListObjectsCommand,
	type S3ServiceException
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { format, parse } from "path";

import { decrypt, encrypt } from "../../utils/aesEncryptDecryptData.js";
import { parseDuration } from "../../utils/parseDuration.js";
import { logger } from "../../winston_logger.js";

export class S3Service {
	static s3Client = new S3Client({
		region: process.env.AWS_REGION,
		credentials: {
			accessKeyId: process.env.AWS_ACCESS_ID,
			secretAccessKey: process.env.AWS_ACCESS_KEY
		}
	});

	static bucketName = process.env.AWS_S3_BUCKET_NAME;

	static encryptDocuments = process.env.AWS_S3_ENCRYPT_DOCUMENTS;
	static encryptionKey = process.env.AWS_S3_ENCRYPTION_KEY;
	static encryptedDocumentDownloadBaseUrl = process.env.AWS_S3_ENCRYPTED_DOCUMENT_DOWNLOAD_BASE_URL;
	static encryptedDocumentDownloadHmacKey =
		process.env.AWS_S3_ENCRYPTED_DOCUMENT_DOWNLOAD_HMAC_SECRET_KEY;

	/**
	 * Uploads document to S3 bucket at given file path
	 * @param filePath Path of file relative to S3 bucket root directory
	 * @param fileContent File as Buffer to upload to S3
	 */
	static async uploadDocument(filePath: string, fileContent: Buffer) {
		let modifiedFilePath = filePath;

		let uploadId;
		try {
			logger.debug(
				"'Document path' : %o, 'Original document size' : %o",
				filePath,
				fileContent.length
			);
			const originalExtension = parse(modifiedFilePath).ext;
			if (this.encryptDocuments) {
				modifiedFilePath = format({ ...parse(modifiedFilePath), base: "", ext: ".json" });
				const { encrypted_data: encryptedFileContent, iv } = encrypt(
					fileContent.toString("base64"),
					this.encryptionKey
				);
				fileContent = Buffer.from(
					JSON.stringify({
						content: encryptedFileContent,
						iv: iv,
						extension: originalExtension
					})
				);
			}

			const multipartUploadCommand = await this.s3Client.send(
				new CreateMultipartUploadCommand({
					Bucket: this.bucketName,
					Key: modifiedFilePath,
					Metadata: {
						originalExtension: originalExtension
					}
				})
			);

			uploadId = multipartUploadCommand.UploadId;

			const uploadPromises = [];

			const partSize = 10 * 1024 * 1024; // 10 MB
			const numberOfParts = Math.ceil(fileContent.length / partSize);

			logger.info(
				"Initiating file upload with 'partSize': %o, 'numberOfParts': %o, 'filePath': %o, 'fileSize': %o",
				partSize,
				numberOfParts,
				modifiedFilePath,
				fileContent.length
			);

			for (let i = 0; i < numberOfParts; i++) {
				const start = i * partSize;
				const end = start + partSize;
				uploadPromises.push(
					this.s3Client
						.send(
							new UploadPartCommand({
								Bucket: this.bucketName,
								Key: modifiedFilePath,
								UploadId: uploadId,
								Body: fileContent.subarray(start, end),
								PartNumber: i + 1
							})
						)
						.then((d) => {
							logger.debug("Part %o uploaded", i + 1);
							return d;
						})
				);
			}

			const uploadResults = await Promise.all(uploadPromises);
			logger.info("Upload completed for file: %o", modifiedFilePath);

			await this.s3Client.send(
				new CompleteMultipartUploadCommand({
					Bucket: this.bucketName,
					Key: modifiedFilePath,
					UploadId: uploadId,
					MultipartUpload: {
						Parts: uploadResults.map(({ ETag }, i) => ({
							ETag,
							PartNumber: i + 1
						}))
					}
				})
			);
		} catch (err) {
			logger.error("Error occurred in uploading file: %o to S3. Error: %o", modifiedFilePath, err);

			if (uploadId) {
				const abortCommand = new AbortMultipartUploadCommand({
					Bucket: this.bucketName,
					Key: modifiedFilePath,
					UploadId: uploadId
				});
				await this.s3Client.send(abortCommand);
			}
			throw err;
		}
	}

	/**
	 * Returns the presigned url for given filePath in S3 bucket
	 * @param filePath Path of file relative to S3 bucket root directory
	 * @param expiresIn Defaults to '10m'. Relative time string like '10m', '1h' or number representing seconds after which presigned url should expires. e.g. '10m' or 600 both are valid values and will set presigned url expiration to 10 mins after current time
	 */
	static async getPresignedUrl(filePath: string, expiresIn: string | number = "10m") {
		let modifiedFilePath = filePath;

		let expirationTime: number;
		if (typeof expiresIn == "string") {
			expirationTime = Math.ceil(parseDuration(expiresIn) / 1000);
		} else {
			expirationTime = expiresIn;
		}

		if (this.encryptDocuments) {
			const originalFilePath = modifiedFilePath;

			modifiedFilePath = format({ ...parse(modifiedFilePath), base: "", ext: ".json" });

			const expiresAt = Math.floor(Date.now() / 1000) + expirationTime;
			const stringToSign = `${originalFilePath}:${expiresAt}`;
			const signature = crypto
				.createHmac("sha256", this.encryptedDocumentDownloadHmacKey)
				.update(stringToSign)
				.digest("hex");

			return `${this.encryptedDocumentDownloadBaseUrl}?file=${originalFilePath}&expires_at=${expiresAt}&signature=${signature}`;
		} else {
			const command = new GetObjectCommand({ Bucket: this.bucketName, Key: modifiedFilePath });

			const presignedURL = await getSignedUrl(this.s3Client, command, {
				expiresIn: expirationTime
			});

			return presignedURL;
		}
	}

	/**
	 * Verifies presigned url in case of document encryption is enabled and local presigned url is returned
	 * @param filePath File Path for which presigned url was generated
	 * @param expiresAt Presigned URL expiry
	 * @param signature HMAC signature to verify
	 */
	static verifyPresignedURL(filePath: string, expiresAt: number, signature: string) {
		// Check if the link has expired
		if (Math.floor(Date.now() / 1000) > expiresAt) {
			return false;
		}

		const stringToSign = `${filePath}:${expiresAt}`;
		const expectedSignature = crypto
			.createHmac("sha256", this.encryptedDocumentDownloadHmacKey)
			.update(stringToSign)
			.digest("hex");

		return expectedSignature === signature;
	}

	/**
	 * Checks if document exists in S3 bucket at given file path
	 * @param filePath Path of file relative to S3 bucket root directory
	 */
	static async checkDocumentExist(filePath: string) {
		let modifiedFilePath = filePath;

		if (this.encryptDocuments) {
			modifiedFilePath = format({ ...parse(modifiedFilePath), base: "", ext: ".json" });
		}

		const command = new HeadObjectCommand({
			Bucket: this.bucketName,
			Key: modifiedFilePath
		});

		try {
			await this.s3Client.send(command);
			return true;
		} catch (error) {
			// Client throws not found exception
			if ((error as S3ServiceException).$metadata.httpStatusCode == StatusCodes.NOT_FOUND) {
				logger.info(`File at path: ${modifiedFilePath} not found in S3 bucket: ${this.bucketName}`);
				return false;
			}
			logger.error("Exception occurred in checkDocumentExists: %o", error as S3ServiceException);
			throw error;
		}
	}

	/**
	 * Gets metadata of document from S3 bucket at given file path
	 * @param filePath Path of file relative to S3 bucket root directory
	 */
	static async getObjectMetadata(filePath: string) {
		let modifiedFilePath = filePath;

		if (this.encryptDocuments) {
			modifiedFilePath = format({ ...parse(modifiedFilePath), base: "", ext: ".json" });
		}

		const command = new HeadObjectCommand({
			Bucket: this.bucketName,
			Key: modifiedFilePath
		});

		try {
			const data = await this.s3Client.send(command);

			if (!data.Metadata) {
				throw new Error(`File not found at path: ${modifiedFilePath}`);
			}

			return data.Metadata;
		} catch (error) {
			// Client throws not found exception
			logger.error(
				"Exception occurred in getObjectMetadata: %o",
				(error as S3ServiceException).$metadata.httpStatusCode
			);
			throw error;
		}
	}

	/**
	 * Retrieves all documents in S3 starting whose name starting with given prefix
	 * @param filePathPrefix Prefix to list documents
	 */
	static async listDocuments(filePathPrefix: string) {
		let modifiedFilePathPrefix = filePathPrefix;

		if (this.encryptDocuments && parse(modifiedFilePathPrefix).ext) {
			modifiedFilePathPrefix = format({ ...parse(modifiedFilePathPrefix), base: "", ext: ".json" });
		}

		const command = new ListObjectsCommand({
			Bucket: this.bucketName,
			Prefix: modifiedFilePathPrefix,
			MaxKeys: 100_000
		});

		return (await this.s3Client.send(command)).Contents || [];
	}

	/**
	 * Downloads document from S3 bucket at given file path
	 * @param filePath Path of file relative to S3 bucket root directory
	 */
	static async downloadDocument(filePath: string) {
		let modifiedFilePath = filePath;

		if (this.encryptDocuments) {
			modifiedFilePath = format({ ...parse(modifiedFilePath), base: "", ext: ".json" });
		}

		const fileExists = await this.checkDocumentExist(modifiedFilePath);

		if (!fileExists) {
			return undefined;
		}

		const command = new GetObjectCommand({
			Bucket: this.bucketName,
			Key: modifiedFilePath
		});

		const file = await (await this.s3Client.send(command)).Body?.transformToByteArray();

		if (this.encryptDocuments && file) {
			const jsonFile = JSON.parse(Buffer.from(file).toString());
			const decryptedFileContent = decrypt(jsonFile.content, this.encryptionKey, jsonFile.iv);

			return Buffer.from(decryptedFileContent as string, "base64");
		}

		return file ? Buffer.from(file) : undefined;
	}

	/**
	 * Deletes document from S3 for given file path
	 * @param filePath Path of S3 object to delete relative to bucket root directory
	 */
	static async deleteDocument(filePath: string) {
		let modifiedFilePath = filePath;

		if (this.encryptDocuments) {
			modifiedFilePath = format({ ...parse(modifiedFilePath), base: "", ext: ".json" });
		}

		logger.debug("Deleting document from S3 bucket: %o", modifiedFilePath);

		const command = new DeleteObjectCommand({
			Bucket: this.bucketName,
			Key: modifiedFilePath
		});
		const response = await this.s3Client.send(command);

		logger.debug("S3 bucket delete command response: %o", JSON.stringify(response));
	}

	static async deleteAllDocumentByPrefix(filePathPrefix: string) {
		const documents = await this.listDocuments(filePathPrefix);

		for (let i = 0; i < documents.length; i++) {
			const key = documents[i].Key;
			if (key) {
				logger.debug(`Deleting document ${key} from S3 bucket.`);
				await this.deleteDocument(key);
			}
		}
	}
}
