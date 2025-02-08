self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('message', event => {
    if (event.data.action === 'clearNotifications') {
        self.registration.getNotifications().then(notifications => {
            notifications.forEach(notification => notification.close());
        });
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            if (clientList.length > 0) {
                clientList[0].focus();
            } else {
                clients.openWindow('/chat.html');
            }
        })
    );
}); 