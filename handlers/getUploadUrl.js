// Importing s3 modules from AWS SDK
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');

// crearting an S3 client instance with the specified region
const s3Client = new S3Client({ region: process.env.REGION });
const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

// Lambda handler function to generate a signed URL for uploading a banner image to S3
exports.getUploadUrl = async (event) => {
	try {
		// Extracting the bucket name and key from the event object
		const bucketName = process.env.CATEGORY_IMAGES_BUCKET;

		// Parsing the incoming event body to get filename and content type
		const { fileName, fileType, categoryName } = JSON.parse(event.body);

		// Validating the presence of fileName and fileType
		if (!fileName || !fileType || !categoryName) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: 'File name, type and category name are required.' }),
			};
		}

		// Creating an s3 PutObjectCommand with the specified bucket, key, and content type
		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: fileName,
			ContentType: fileType,
		});

		// Generating a signed URL for the PutObjectCommand
		const signedUrl = await getSignedUrl(s3Client, command, {
			expiresIn: 3600, // URL valid for 1 hour
		});

		// Storing the file metadata in DynamoDB
		const putItemCommand = new PutItemCommand({
			TableName: process.env.CATEGORY_TABLE,
			Item: {
				categoryName: { S: categoryName },
				fileName: { S: fileName },
				createdAt: { S: new Date().toISOString() },
			},
		});

		await dynamoDbClient.send(putItemCommand);

		// Returning the signed URL in the response
		return {
			statusCode: 200,
			body: JSON.stringify({
				signedUrl,
			}),
		};
	} catch (error) {
		// Handling errors and returning a 500 status code with the error message
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to generate signed URL.', details: error.message }),
		};
	}
};
