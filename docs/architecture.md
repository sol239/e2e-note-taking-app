# 🧩 ARCHITEKTURA DO MODULŮ, KONTEJNERŮ A KOMPONENT

## 🧱 1️⃣ ÚROVEŇ: SYSTEM CONTEXT

### 🎯 Cíl systému

Umožnit uživateli bezpečně ukládat, šifrovat, sdílet a spravovat poznámky a soubory **s end-to-end šifrováním** (zero-knowledge backend).

### 👥 Hlavní aktéři

| Aktér                            | Popis                    | Interakce                                  |
| -------------------------------- | ------------------------ | ------------------------------------------ |
| 🧑 Uživatel                      | Osoba používající webapp | Registrace, přihlášení, práce s poznámkami |
| 🌐 Frontend aplikace             | Web klient v prohlížeči  | UI, E2E šifrování, API komunikace          |
| ⚙️ Backend API                   | FastAPI server           | Autentizace, metadata, S3 URL management   |
| ☁️ Objektové úložiště (S3/MinIO) | Storage pro ciphertexty  | Ukládá šifrované soubory/poznámky          |
| 🗄️ Databáze (PostgreSQL)        | Metadata                 | Uživatelská data, klíče, reference         |

---

## 🧭 2️⃣ ÚROVEŇ: CONTAINERS (kontejnery / běhové jednotky)

Představuje fyzické běhové entity (např. Docker kontejnery, služby).

```
+---------------------------------------------------------------+
|                         FRONTEND (React)                      |
|---------------------------------------------------------------|
| - Crypto Engine (libsodium)                                   |
| - Auth Module (Login, 2FA, Recovery)                          |
| - Notes Module (CRUD, Editor, Markdown)                       |
| - Sharing Module (re-encrypting keys)                         |
| - Files Module (Chunked Encryption & Upload)                  |
| - Local Cache (IndexedDB, Offline Sync)                       |
+---------------------------------------------------------------+
           | HTTPS (REST + JWT)
           v
+---------------------------------------------------------------+
|                    BACKEND API (FastAPI)                      |
|---------------------------------------------------------------|
| - Auth Service (Argon2id, JWT, TOTP)                          |
| - Metadata Service (notes, users, access control)              |
| - File Service (Presigned URLs, Manifest tracking)             |
| - Share Service (ItemKeys CRUD)                               |
| - Audit & Rate Limiter                                         |
+---------------------------------------------------------------+
           | SQLAlchemy / boto3
           v
+----------------+     +----------------+
|  PostgreSQL DB |     |  S3 / MinIO    |
|----------------|     |----------------|
| users          |     | encrypted blobs|
| items          |     | chunked files  |
| item_keys      |     | manifests      |
+----------------+     +----------------+
```

Každý kontejner je samostatně nasaditelný (Docker image):

* `frontend` – **Next.js** aplikace (React framework, Vite build není potřeba, hostovaná v CDN nebo přes Node/nginx)
* `backend-api` – FastAPI (Python 3.12)
* `postgres` – relační databáze
* `minio` – objektové úložiště pro ciphertexty
* *(volitelně)* `nginx` – reverzní proxy, rate limiting, CSP headery

---

## 🧩 3️⃣ ÚROVEŇ: COMPONENTS (uvnitř kontejnerů)

Tady rozbijeme *frontend* i *backend* na jednotlivé komponenty, které spolu komunikují.

---

### 🖥️ FRONTEND (**Next.js / TypeScript**)

Frontend je postavený na frameworku **Next.js** (React), což umožňuje server-side rendering, API routes, optimalizaci performance a lepší DX.

#### 🔐 Crypto Engine (core)

* Implementace E2E šifrování/dešifrování (`libsodium-wrappers`)
* Správa klíčové hierarchie (`WK`, `UMK`, `IK`)
* Utility pro Argon2id, XChaCha20-Poly1305, X25519, Ed25519
* Cache klíčů pouze v paměti (React context)
* Integrace s WebCrypto API jako fallback

#### 👤 Auth Module

* Komponenty: `Register`, `Login`, `Unlock`, `Setup2FA`, `Recovery`
* Funkce:

  * Registrace uživatele (vytvoření klíčů, hashů)
  * Přihlášení (ověření hesla, dešifrování klíče)
  * 2FA ověření (TOTP)
  * Reset hesla pomocí recovery code
* Správa JWT tokenu (lokální storage + refresh logic)

#### 📝 Notes Module

* Komponenty: `NotesList`, `NoteEditor`, `NoteViewer`
* Funkce:

  * CRUD operace (lokální šifrování/dešifrování)
  * Markdown/HTML editor (např. TipTap)
  * Lokální cache v IndexedDB
  * Auto-sync s API po reconnectu
* Dešifrování `IK` pro čtení obsahu

#### 🤝 Sharing Module

* Komponenty: `ShareDialog`, `UserLookup`
* Funkce:

  * Vyhledávání uživatele podle e-mailu
  * Re-encrypt `IK` pro sdíleného uživatele
  * Odebírání přístupů
* Vše probíhá čistě klientsky

#### 📂 Files Module

* Komponenty: `FileUpload`, `FileViewer`, `ChunkUploader`
* Funkce:

  * Chunking velkých souborů (5MB)
  * Šifrování každého chunku zvlášť
  * Upload přes presigned URL na S3
  * Manifest management (zašifrovaný JSON)
  * Download + dešifrování chunků

#### 💾 Local Storage Layer

* IndexedDB (např. Dexie.js)
* Cache poznámek a souborů
* Offline režim: lokální sync queue
* Integrace s service workerem

---

### ⚙️ BACKEND (FastAPI)

#### 1️⃣ Auth Service

* Endpoints:

  * `POST /auth/register`
  * `POST /auth/login`
  * `POST /auth/2fa/setup`
  * `POST /auth/2fa/verify`
* Technologie:

  * `argon2-cffi` pro hash hesel
  * `pyotp` pro TOTP
  * `pyjwt` pro JWT tokeny
* Odpovědnost:

  * Zero-knowledge autentizace
  * Správa session tokenů
  * Správa TOTP secretů

#### 2️⃣ Metadata Service

* Endpoints:

  * `GET /items`
  * `POST /items`
  * `PATCH /items/{id}`
  * `DELETE /items/{id}`
* Správa tabulek `items` (poznámky, složky, soubory)
* Obsah: pouze **šifrovaná metadata**

#### 3️⃣ File Service

* Endpoints:

  * `POST /files/presign-upload`
  * `GET /files/presign-download`
* Používá `boto3` pro generování presigned URL
* Logika chunkování a manifestů

#### 4️⃣ Share Service

* Endpoints:

  * `GET /users/lookup`
  * `POST /items/{id}/keys`
  * `DELETE /items/{id}/keys`
* Správa `item_keys` tabulky
* Server pouze validuje oprávnění, nikdy nevidí klíče

#### 5️⃣ Security / Middleware Layer

* Middleware:

  * CSP headery (`script-src 'self'`)
  * Rate limiting (SlowAPI)
  * CORS
  * Logging & audit
* Background tasks (např. cleanup orphaned S3 chunks)

---

## ⚙️ 4️⃣ ÚROVEŇ: MODULES (v kódu)

### Frontend (**Next.js TypeScript Monorepo struktura**)

```
src/
├── app/                # Next.js App Router (stránky, layouty)
│   ├── page.tsx        # Root stránka
│   ├── layout.tsx      # Globální layout
│   ├── auth/           # /auth (login, register, 2FA, recovery)
│   ├── notes/          # /notes (seznam, editor, viewer)
│   ├── files/          # /files (upload, viewer)
│   ├── share/          # /share (sdílení)
├── components/         # UI komponenty (formuláře, dialogy, seznamy)
├── contexts/           # React contexty (např. CryptoContext.tsx)
├── hooks/              # Custom React hooky
├── lib/                # Utility (crypto, api, storage, helpers)
│   ├── crypto/
│   ├── api/
│   └── storage/
├── workers/            # Web/Service workery (encryptionWorker.ts, syncWorker.ts)
├── public/             # Statické soubory (ikony, manifest, obrázky)
└── types/              # Typy a rozhraní (TypeScript)
```

> Next.js používá složku `app/` pro App Router (moderní routing), případně `pages/` pro starší Pages Router. API routes lze umístit do `app/api/` nebo `pages/api/`.

### Backend (Python / FastAPI)

```
app/
├── main.py
├── api/
│   ├── routes/
│   │   ├── auth.py
│   │   ├── items.py
│   │   ├── files.py
│   │   └── share.py
│   ├── dependencies.py
│   └── middleware.py
├── core/
│   ├── security.py
│   ├── settings.py
│   ├── jwt.py
│   └── utils.py
├── models/
│   ├── users.py
│   ├── items.py
│   └── item_keys.py
├── schemas/
│   ├── auth.py
│   ├── items.py
│   ├── files.py
│   └── share.py
└── services/
    ├── auth_service.py
    ├── file_service.py
    ├── share_service.py
    └── metadata_service.py
```

---

## 🏗️ 5️⃣ DevOps pohled (Deployment)

Každý kontejner → samostatný Docker image:

| Container  | Image                | Popis                             |
| ---------- | -------------------- | --------------------------------- |
| `frontend` | `node:20 + nginx`    | Build & serve statickou React app |
| `backend`  | `python:3.12-slim`   | FastAPI server                    |
| `postgres` | `postgres:16`        | Relační metadata                  |
| `minio`    | `minio/minio:latest` | Objektové úložiště                |
| `nginx`    | `nginx:alpine`       | Reverse proxy, SSL, CSP           |

**Komunikace:**

* Frontend ↔ Backend: HTTPS (JWT auth)
* Backend ↔ PostgreSQL: TCP (5432)
* Backend ↔ MinIO: HTTPS (presigned URLs)
* NGINX: poskytuje CSP, TLS, redirecty

