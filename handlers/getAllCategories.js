const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.REGION });

exports.getAllCategories = async (event) => {
	try {
		const params = {
			TableName: process.env.CATEGORY_TABLE,
		};

		const command = new ScanCommand(params);
		const { Items } = await client.send(command);

		if (!Items || Items.length === 0) {
			return {
				statusCode: 404,
				body: JSON.stringify({ message: 'Categories not found' }),
			};
		}

		// Convert DynamoDB items to a more usable format
		const categories = Items.map((item) => {
			return {
				categoryName: item.categoryName.S,
				imageUrl: item.imageUrl.S,
			};
		});

		return {
			statusCode: 200,
			body: JSON.stringify({ categories }),
		};
	} catch (error) {
		console.error('Error fetching categories:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({ error: 'Failed to fetch categories' }),
		};
	}
};
