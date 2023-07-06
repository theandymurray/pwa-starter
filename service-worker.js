/*
Copyright 2021 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

 import { warmStrategyCache, offlineFallback } from 'workbox-recipes';
 import { CacheFirst } from 'workbox-strategies';
 import { registerRoute } from 'workbox-routing';
 import { CacheableResponsePlugin } from 'workbox-cacheable-response';
 import { ExpirationPlugin } from 'workbox-expiration';
 
 // Set up page cache
 const pageCache = new CacheFirst({
   cacheName: 'page-cache',
   plugins: [
     new CacheableResponsePlugin({
       statuses: [0, 200],
     }),
     new ExpirationPlugin({
       maxAgeSeconds: 30 * 24 * 60 * 60,
     }),
   ],
 });
 
 warmStrategyCache({
   urls: ['/index.html', '/'],
   strategy: pageCache,
 });

 // Set up offline fallback
offlineFallback({
     pageFallback: '/offline.html',
});
 
 registerRoute(({ request }) => request.mode === 'navigate', pageCache);

// When there's an incoming fetch request, try and respond with a precached resource, otherwise fall back to the network
self.addEventListener('fetch', (event) => {
  console.log('Fetch intercepted for:', event.request.url);
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    }),
  );
});

// Set up asset cache
registerRoute(
     ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
     new StaleWhileRevalidate({
          cacheName: 'asset-cache',
          plugins: [
               new CacheableResponsePlugin({
                    statuses: [0, 200],
               }),
          ],
     }),
);