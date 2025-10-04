import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkOnly, CacheFirst } from 'workbox-strategies'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// Plugin VitePWA akan secara otomatis menyuntikkan daftar file untuk di-cache di sini.
precacheAndRoute(self.__WB_MANIFEST)

// Strategi caching untuk gambar
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Strategi untuk API calls.
// Gunakan NetworkOnly untuk semua request ke /api/.
// Ini memastikan semua request (GET, POST, PUT, DELETE) langsung ke network
// dan menghindari masalah dengan otentikasi atau data yang basi.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
);

self.addEventListener('push', e => {
  const data = e.data.json();
  console.log('Push Recieved...');
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/logo.png', // Ikon notifikasi
    data: data.data
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      // Buka tab baru jika aplikasi belum terbuka
      return clients.openWindow(urlToOpen);
    })
  );
});