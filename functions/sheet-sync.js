const { GoogleSpreadsheet } = require('google-spreadsheet');

// Get environment variables
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY_B64 = process.env.GOOGLE_PRIVATE_KEY_B64;
const SHEET_ID = process.env.SHEET_ID;

// Decode the base64-encoded private key
const GOOGLE_PRIVATE_KEY = Buffer.from(GOOGLE_PRIVATE_KEY_B64, 'base64').toString();

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    // Simple test first
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Test successful',
        email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        sheet: SHEET_ID,
        keyLength: GOOGLE_PRIVATE_KEY.length
      })
    };
    
    // The rest of your Google Sheets code would go here
    // but let's first test if we can get the basic connection working
  } 
  catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
