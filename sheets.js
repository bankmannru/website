// Your Google Sheet must be published to web first
// File > Share > Publish to web > Select Sheet1 > Publish
// Then copy the URL and extract the ID
const SHEET_ID = '16yZfXpChwAs5eb0wy0Rj3AACxtYkuaAyK0bhv5HTz98';
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3YXeyGYJ4sRbeTdzi1dXIQ50QlOGONMJTSOJ0xsw483zFplNqetI4tIIWgI8M6UKg/exec';

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
        const [recipientBalance, senderBalance] = await Promise.all([
            getBalance(toUserId),
            fromUserId === 'SYSTEM' ? '∞' : getBalance(fromUserId)
        ]);

        console.log('Balances:', { recipientBalance, senderBalance });
        
        if (recipientBalance === null) {
            console.error('Recipient not found');
            return false;
        }

        // SYSTEM user has infinite balance
        if (fromUserId !== 'SYSTEM' && (senderBalance === null || parseInt(senderBalance) < amount)) {
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

            // Shorter timeout
            setTimeout(() => {
                delete window[callbackName];
                script.remove();
                reject(new Error('Transaction timeout'));
            }, 5000);
        });

        console.log('Transaction response:', result);

        if (result.success) {
            // Skip balance verification for SYSTEM user
            if (fromUserId === 'SYSTEM') {
                console.log('SYSTEM transaction successful');
                return true;
            }

            // Reduced wait time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
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

async function checkBanStatus(userId) {
    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            console.error('Failed to fetch sheet data:', response.status, response.statusText);
            return null;
        }
        
        const csvText = await response.text();
        console.log('Raw CSV Data:', csvText);
        
        // Split into rows and clean up each cell
        const rows = csvText.split('\n').map(row => {
            // Split by comma but handle quoted values
            const cells = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
            return cells.map(cell => {
                // Remove quotes and trim whitespace
                return cell.replace(/^["']|["']$/g, '').trim();
            });
        });
        
        console.log('Parsed Rows:', rows);
        
        // Find user row (skip header)
        const userRow = rows.find((row, index) => index > 0 && row[0] === userId);
        console.log('Found User Row:', userRow);
        
        if (userRow) {
            // Get ban status from column C (index 2) and reason from column D (index 3)
            const status = {
                isBanned: userRow[2] === 'TRUE',
                reason: userRow[3] || ''
            };
            console.log('Ban Status Check:', {
                userId,
                banField: userRow[2],
                isBanned: status.isBanned,
                reason: status.reason,
                fullRow: userRow
            });
            return status;
        }
        
        console.log('User not found:', userId);
        return null;
    } catch (error) {
        console.error('Error checking ban status:', error);
        return null;
    }
}

async function setBanState(userId, isBanned, banReason = '') {
    try {
        const requestBody = {
            action: 'setBanState',
            userId,
            isBanned,
            banReason
        };
        
        // Create a unique callback name
        const callbackName = 'jsonpCallback' + Date.now();
        
        // Create a promise that will be resolved by the JSONP callback
        const result = await new Promise((resolve, reject) => {
            window[callbackName] = function(data) {
                delete window[callbackName];
                script.remove();
                resolve(data);
            };

            const script = document.createElement('script');
            script.src = `${GOOGLE_APPS_SCRIPT_URL}?callback=${callbackName}&data=${encodeURIComponent(JSON.stringify(requestBody))}`;
            document.body.appendChild(script);

            setTimeout(() => {
                delete window[callbackName];
                script.remove();
                reject(new Error('Operation timeout'));
            }, 5000);
        });

        return result.success;
    } catch (error) {
        console.error('Error setting ban state:', error);
        return false;
    }
}