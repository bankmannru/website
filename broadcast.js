async function checkAndDisplayBroadcast() {
    try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=SYSTEM`;
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            console.error('Failed to fetch broadcast data');
            return;
        }
        
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => 
            row.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, ''))
        );
        
        // Get broadcast message and URL from first row
        const broadcastMessage = rows[0]?.[0];
        const broadcastUrl = rows[0]?.[1];
        
        if (broadcastMessage) {
            // Create or update banner
            let banner = document.querySelector('.system-broadcast-banner');
            if (!banner) {
                banner = document.createElement('div');
                banner.className = 'system-broadcast-banner';
                banner.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background-color: #ff0000;
                    color: white;
                    padding: 10px;
                    text-align: center;
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 10px;
                `;
                document.body.prepend(banner);
            }

            banner.innerHTML = `
                <span>${broadcastMessage}</span>
                ${broadcastUrl ? `<button onclick="window.location.href='${broadcastUrl}'" 
                    style="background: white; color: red; border: none; padding: 5px 15px; cursor: pointer; border-radius: 4px;">
                    Перейти
                </button>` : ''}
            `;
        } else {
            // Remove banner if no broadcast message
            const banner = document.querySelector('.system-broadcast-banner');
            if (banner) {
                banner.remove();
            }
        }
    } catch (error) {
        console.error('Error checking broadcast:', error);
    }
}

// Check for broadcast message every 30 seconds
setInterval(checkAndDisplayBroadcast, 30000);

// Initial check when page loads
document.addEventListener('DOMContentLoaded', checkAndDisplayBroadcast); 