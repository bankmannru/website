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
                    padding: 12px;
                    text-align: center;
                    z-index: 1000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 12px;
                    font-family: 'Roboto', sans-serif;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                `;
                document.body.prepend(banner);
            }

            banner.innerHTML = `
                <span style="font-size: 16px;">${broadcastMessage}</span>
                ${broadcastUrl ? `
                    <md-filled-button 
                        onclick="window.location.href='${broadcastUrl}'"
                        style="--md-sys-color-primary: white; --md-sys-color-on-primary: #ff0000; margin-left: 8px;">
                        Перейти
                    </md-filled-button>
                ` : ''}
            `;

            // Adjust body padding
            document.body.style.paddingTop = (banner.offsetHeight + 8) + 'px';
        } else {
            // Remove banner if no broadcast message
            const banner = document.querySelector('.system-broadcast-banner');
            if (banner) {
                banner.remove();
                document.body.style.paddingTop = '0';
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