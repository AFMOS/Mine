const { GoogleSpreadsheet } = require('google-spreadsheet');

// Create a Google Service Account and download JSON key
// Add the private key to Netlify Environment Variables
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const SHEET_ID = process.env.SHEET_ID;

exports.handler = async function(event, context) {
  // Enable CORS for your domain
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    const doc = new GoogleSpreadsheet(SHEET_ID);
    
    // Authenticate with Google
    await doc.useServiceAccountAuth({
      client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: GOOGLE_PRIVATE_KEY,
    });
    
    await doc.loadInfo(); // Load sheet data
    
    if (event.httpMethod === 'GET') {
      // Handle GET request - read data from sheet
      const sheet = doc.sheetsByIndex[0]; // Get the first sheet
      console.log("Sheet headers:", sheet.headerValues);
      
      // Just return success to check connectivity
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Connected to Google Sheets successfully",
          headers: sheet.headerValues
        })
      };
    } 
    else if (event.httpMethod === 'POST') {
      // Handle POST request - save data to sheet
      const payload = JSON.parse(event.body);
      const sheet = doc.sheetsByIndex[0];
      
      // For saving all app data, create a date-stamped backup row
      const row = {
        timestamp: new Date().toISOString(),
        userId: payload.userId || 'anonymous',
        data: JSON.stringify(payload.data)
      };
      
      // Log information without waiting
      console.log("Attempting to add row with headers:", sheet.headerValues);
      
      // Add the row and return success
      await sheet.addRow(row);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Data saved successfully' })
      };
    }
    
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } 
  catch (error) {
    console.error('Error accessing sheet:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to access Google Sheet', details: error.message })
    };
  }
};
