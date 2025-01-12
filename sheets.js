// Your Google Sheet must be published to web first
// File > Share > Publish to web > Select Sheet1 > Publish
// Then copy the URL and extract the ID
const SHEET_ID = '16yZfXpChwAs5eb0wy0Rj3AACxtYkuaAyK0bhv5HTz98';

async function getBalance(userId) {
    try {
        // Construct the CSV export URL
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            console.error('Failed to fetch sheet data:', response.status, response.statusText);
            return null;
        }
        
        const csvText = await response.text();
        console.log('Received CSV:', csvText); // Debug log
        
        // Parse CSV
        const rows = csvText.split('\n').map(row => 
            row.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
        );
        
        // Find user's balance (assuming first column is userId, second is balance)
        const userRow = rows.find((row, index) => index > 0 && row[0] === userId);
        
        if (userRow && userRow[1]) {
            console.log('Found balance:', userRow[1]); // Debug log
            return userRow[1];
        }
        console.log('User not found in sheet'); // Debug log
        return null;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}