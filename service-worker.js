<<<<<<< HEAD
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
=======
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
>>>>>>> 58afe73bc799a44fad7f9cc6e3f1e7079ea65410
}); 