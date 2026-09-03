const CACHE_NAME = "quickq-timer-v13";

const APP_SHELL = [
  "./",
  "./index.html"
];


/* =========================
   インストール
   QuickQ本体をiPhoneに保存
========================= */

self.addEventListener("install", (event) => {

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL);
      })
  );

  self.skipWaiting();

});


/* =========================
   新しいバージョンを有効化
   古いキャッシュを削除
========================= */

self.addEventListener("activate", (event) => {

  event.waitUntil(

    Promise.all([

      caches.keys().then((names) => {

        return Promise.all(

          names.map((name) => {

            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }

          })

        );

      }),

      self.clients.claim()

    ])

  );

});


/* =========================
   通信処理

   HTMLは
   ネットがあれば最新版
   ↓
   ネットがなければ保存版
========================= */

self.addEventListener("fetch", (event) => {

  if (event.request.method !== "GET") {
    return;
  }


  /* ページを開く要求 */

  if (event.request.mode === "navigate") {

    event.respondWith(

      fetch(event.request)

        .then((response) => {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {

              cache.put(
                "./index.html",
                copy
              );

            });

          return response;

        })

        .catch(async () => {

          const cache =
            await caches.open(CACHE_NAME);

          return (
            await cache.match("./index.html")
          ) || (
            await cache.match("./")
          );

        })

    );

    return;

  }


  /* その他のファイル */

  event.respondWith(

    caches.match(event.request)

      .then((cached) => {

        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then((response) => {

            if (
              response &&
              response.status === 200
            ) {

              const copy =
                response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {

                  cache.put(
                    event.request,
                    copy
                  );

                });

            }

            return response;

          });

      })

  );

});