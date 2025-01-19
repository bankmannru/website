// Your Google Sheet must be published to web first
// File > Share > Publish to web > Select Sheet1 > Publish
// Then copy the URL and extract the ID
const SHEET_ID = '16yZfXpChwAs5eb0wy0Rj3AACxtYkuaAyK0bhv5HTz98';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmqFBH8cK0Liwl47O1Fll0f0dUHMTvSJYZKyejME7SIrZiOMUXJ36Lmlz3WgyNf-h3/exec';

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
        
        // Parse CSV
        const rows = csvText.split('\n').map(row => 
            row.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
        );
        
        // Find user's balance (assuming first column is userId, second is balance)
        const userRow = rows.find((row, index) => index > 0 && row[0] === userId);
        
        if (userRow && userRow[1]) {
            return userRow[1];
        }
        return null;
    } catch (error) {
        console.error('Error fetching balance:', error);
        return null;
    }
}

async function makeTransaction(fromUserId, toUserId, amount) {
    try {
        console.log('Starting transaction:', { fromUserId, toUserId, amount });
        
        // First check if recipient exists
        const recipientBalance = await getBalance(toUserId);
        console.log('Recipient balance:', recipientBalance);
        if (recipientBalance === null) {
            console.error('Recipient not found');
            return false;
        }

        // Check sender's balance
        const senderBalance = await getBalance(fromUserId);
        console.log('Sender balance:', senderBalance);
        if (senderBalance === null || parseInt(senderBalance) < amount) {
            console.error('Insufficient balance');
            return false;
        }

        const requestBody = {
            action: 'makeTransaction',
            fromUserId,
            toUserId,
            amount: parseInt(amount)
        };
        console.log('Sending request:', requestBody);

        // Create a unique callback name
        const callbackName = 'jsonpCallback' + Date.now();
        
        // Create a promise that will be resolved by the JSONP callback
        const result = await new Promise((resolve, reject) => {
            // Create the callback function
            window[callbackName] = function(data) {
                delete window[callbackName]; // Clean up
                script.remove(); // Remove the script tag
                resolve(data);
            };

            // Create and append the script tag
            const script = document.createElement('script');
            script.src = `${GOOGLE_APPS_SCRIPT_URL}?callback=${callbackName}&data=${encodeURIComponent(JSON.stringify(requestBody))}`;
            document.body.appendChild(script);

            // Add timeout
            setTimeout(() => {
                delete window[callbackName];
                script.remove();
                reject(new Error('Transaction timeout'));
            }, 10000);
        });

        console.log('Transaction response:', result);

        if (result.success) {
            // Wait a bit for Google Sheets to update
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify the transaction by checking if balance changed
            const newBalance = await getBalance(fromUserId);
            const expectedNewBalance = parseInt(senderBalance) - amount;
            
            console.log('New balance:', newBalance);
            console.log('Expected balance:', expectedNewBalance);
            
            if (newBalance !== null && parseInt(newBalance) === expectedNewBalance) {
                console.log('Transaction successful');
                return true;
            }
        }
        
        console.error('Transaction verification failed');
        return false;
    } catch (error) {
        console.error('Transaction error:', error);
        return false;
    }
}