// Import necessary modules
import { NextApiRequest, NextApiResponse } from 'next';
import mondaySdk from 'monday-sdk-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define the handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Ensure the request method is POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // Extract the query from the request body
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Initialize Monday SDK and set API version and token
  const monday = mondaySdk();
  monday.setApiVersion('2023-10');
  monday.setToken(process.env.MONDAY_KEY as string);

  try {
    // Make API call to Monday.com
    const response = await monday.api(`query ${query}`);
    console.log(`🟡[monday]: ${query}`);
    
    // Send the response back to the client
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error calling Monday API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
