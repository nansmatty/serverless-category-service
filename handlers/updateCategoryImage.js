const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamoDbClient = new DynamoDBClient({ region: process.env.REGION });

exports.updateCategoryImage = async (event) => {
	try {
		const tableName = process.env.CATEGORY_TABLE;

		// Extract file details from s3 event notification
		const record = event.Records[0];

		const bucketName = record.s3.bucket.name;

		// Extract the file name from the S3 event record
		const fileName = record.s3.object.key;

		const fileUrl = `https://${bucketName}.s3.amazonaws.com/${fileName}`;

		const updateItemCommand = new UpdateItemCommand({
			TableName: tableName,
			Key: {
				fileName: { S: fileName }, // Assuming category name is part of the file path
			},
			UpdateExpression: 'SET imageUrl = :imageUrl',
			ExpressionAttributeValues: {
				':imageUrl': { S: fileUrl },
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
