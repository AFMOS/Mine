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
  
  // Handle different HTTP methods
  if (event.httpMethod === 'GET' && event.path === '/.netlify/functions/sheet-sync/test') {
    // This is the test endpoint that was working before
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
  }
  
  try {
    // Now try to actually connect to Google Sheets
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
      const rows = await sheet.getRows();
      
      const data = rows.map(row => {
        // Convert row to a plain object
        const rowData = {};
        sheet.headerValues.forEach(header => {
          rowData[header] = row[header];
        });
        return rowData;
      });
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
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
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Function error', 
        message: error.message,
        stack: error.stack
      })
    };
  }
};
