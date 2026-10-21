// PRTS Story Terminal - Lightweight Pass-through Service Worker for PWA Installation

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// PWA 설치 요건 충족용 네트워크 패스스루 fetch 핸들러
self.addEventListener('fetch', (event) => {
  // Pass-through directly to network
  event.respondWith(fetch(event.request));
});
