const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

exports.updateCategoryData = async (event) => {
	try {
		const tableName = process.env.CATEGORY_TABLE;
		const bucketName = process.env.CATEGORY_IMAGES_BUCKET;

		// Extract file details from s3 event notification
		const record = event.Records[0];

		// Extract the file name from the S3 event record
		const fileName = record.s3.object.key;

		const imageUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

		const updateItemCommand = new UpdateItemCommand({
			TableName: tableName,
			Key: { fileName: { S: fileName } },
			UpdateExpression: 'SET imageUrl = :imageUrl', //update only the image url field
			ExpressionAttributeValues: {
				':imageUrl': { S: imageUrl }, //Assign the new image url
			},
		});

		await dynamoDbClient.send(updateItemCommand);
		return {
			statusCode: 200,
			body: JSON.stringify({
				message: 'Category image updated successfully.',
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to update category image.', details: error.message }),
		};
	}
};
