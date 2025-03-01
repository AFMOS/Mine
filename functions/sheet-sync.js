const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Get environment variables
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY_B64 = process.env.GOOGLE_PRIVATE_KEY_B64;
const SHEET_ID = process.env.SHEET_ID;

// Decode the base64-encoded private key
const GOOGLE_PRIVATE_KEY = Buffer.from(GOOGLE_PRIVATE_KEY_B64, 'base64').toString();

exports.handler = async function(event, context) {
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
    // Create a JWT client directly
    const client = new JWT({
      email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: GOOGLE_PRIVATE_KEY,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    
    // No need to authenticate separately, just create the doc with the client
    const doc = new GoogleSpreadsheet(SHEET_ID);
    doc.useServiceAccountAuth(client);
    
    await doc.loadInfo();
    
    if (event.httpMethod === 'GET') {
      const sheet = doc.sheetsByIndex[0];
      const rows = await sheet.getRows();
      
      const data = rows.map(row => {
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
      const payload = JSON.parse(event.body);
      const sheet = doc.sheetsByIndex[0];
      
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
      body: JSON.stringify({ error: error.message, stack: error.stack })
    };
  }
};
