// service-worker.js — 离线缓存支持

const CACHE_NAME = "bone-weight-cache-v1";
const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./db.js",
    "./logic.js",
    "./service-worker.js"
];

// 安装时缓存文件
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keyList) =>
            Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            )
        )
    );
    self.clients.claim();
});

// 拦截网络请求，优先读缓存
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request);
        })
    );
});
