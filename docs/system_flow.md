
# 🧭 **User Stories & Usage Pipeline pro E2E šifrovanou poznámkovou aplikaci**

## 🧑‍💻 1. Registrace uživatele

### **User Story**

> Jako nový uživatel se chci zaregistrovat pomocí e-mailu a hesla, aby mi aplikace vytvořila bezpečný účet, ke kterému se mohu později přihlásit a odemknout svá data.

### **System Flow**

1. Uživatel otevře registrační stránku a zadá:

   * e-mail
   * heslo
2. Frontend:

   * vygeneruje náhodnou sůl
   * odvodí z hesla klíč pomocí Argon2id (→ Wrapping Key)
   * vytvoří pár klíčů (public/private master key)
   * soukromý klíč zašifruje pomocí Wrapping Key
   * vytvoří hash hesla pro autentizaci
3. Frontend odešle na backend:

   ```json
   {
     "email": "user@example.com",
     "auth_hash": "...",
     "auth_salt": "...",
     "public_master_key": "...",
     "encrypted_private_master_key": "...",
     "wrapping_key_salt": "..."
   }
   ```
4. Backend uloží záznam do `users` tabulky.
5. Uživatel dostane potvrzení o úspěšné registraci a může se přihlásit.

---

## 🔐 2. Přihlášení a odemčení účtu

### **User Story**

> Jako registrovaný uživatel se chci přihlásit, aby se mi lokálně odemkl můj šifrovací klíč a já mohl číst a upravovat své poznámky.

### **System Flow**

1. Uživatel zadá e-mail a heslo.
2. Frontend odešle přihlašovací požadavek na backend.
3. Backend:

   * ověří heslo proti hashovanému `auth_hash`
   * vygeneruje JWT token
   * pošle zpět:

     * JWT
     * `encrypted_private_master_key`
     * `wrapping_key_salt`
4. Frontend:

   * lokálně znovu odvodí Wrapping Key pomocí hesla
   * dešifruje soukromý master klíč (`UMK_private`)
   * drží ho v paměti jen po dobu relace
5. Uživatel je nyní **autentizovaný a “odemčený”**.

---

## 📝 3. Tvorba nové poznámky

### **User Story**

> Jako uživatel chci vytvořit novou poznámku, aby se uložila bezpečně a šifrovaně, aniž by ji server mohl číst.

### **System Flow**

1. Uživatel klikne na **“Nová poznámka”**.
2. Frontend:

   * vytvoří nový symetrický `Item Key (IK)`
   * šifruje obsah poznámky pomocí `IK` (např. XChaCha20)
   * šifruje `IK` asymetricky pro sebe pomocí `UMK_public`
3. Frontend vytvoří dvě entity:

   * `POST /items` → uloží metadata
   * `POST /items/{id}/keys` → uloží `encrypted_IK_for_owner`
4. Backend uloží:

   * šifrovaný `IK`
   * šifrovaný obsah poznámky (do DB nebo S3)
5. Poznámka je uložená — server nikdy nevidí plaintext.

---

## 📖 4. Čtení poznámky

### **User Story**

> Jako uživatel chci otevřít poznámku, aby se dešifrovala a zobrazila jen na mém zařízení.

### **System Flow**

1. Frontend získá:

   * metadata poznámky
   * `encrypted_IK` (pro aktuálního uživatele)
2. Frontend dešifruje:

   * `IK = Decrypt_Asym(encrypted_IK, UMK_private)`
   * `plaintext = Decrypt_Sym(ciphertext, IK)`
3. Poznámka se zobrazí v editoru.

---

## 📤 5. Sdílení poznámky

### **User Story**

> Jako uživatel chci sdílet poznámku s jiným uživatelem tak, aby mohl číst a upravovat obsah, ale server přitom neviděl žádná data.

### **System Flow**

1. Uživatel A zadá e-mail uživatele B.
2. Frontend:

   * dotáže se `/users/lookup?email=userB@example.com` → získá `UMK_public` uživatele B
   * dešifruje vlastní `IK`
   * znovu zašifruje `IK` pro uživatele B (`Encrypt_Asym(IK, UMK_B_public)`)
3. Frontend:

   * pošle `POST /items/{id}/keys` s `user_id=B` a `encrypted_IK_for_B`
4. Backend:

   * uloží do `item_keys` nový řádek (item_id, user_id_B, encrypted_IK_for_B)
5. Uživatel B:

   * při otevření poznámky si dešifruje `IK` svým klíčem
   * otevře a dešifruje obsah poznámky lokálně

---

## 🗂️ 6. Práce se soubory (Upload / Download)

### **User Story**

> Jako uživatel chci nahrát soubor (obrázek, video, audio), který se zašifruje a uloží bezpečně, aby se dal později dešifrovat jen mnou nebo sdílenými uživateli.

### **System Flow**

1. Uživatel vybere soubor.
2. Frontend:

   * vytvoří `ItemKey`
   * rozdělí soubor na chunky (např. 5MB)
   * každý chunk šifruje `Encrypt_Sym(chunk, IK, nonce)`
3. Frontend:

   * žádá backend o presigned URL pro každý chunk (`POST /files/presign`)
   * nahraje chunky přímo do S3 (šifrované)
4. Frontend vytvoří `manifest` se seznamem chunků a nonce.
5. `manifest` se také zašifruje pomocí `IK` a uloží.
6. Při stahování je proces opačný: klient stáhne manifest, dešifruje a poté stáhne a dešifruje chunky.

---

## 🔄 7. Offline práce a synchronizace

### **User Story**

> Chci mít možnost číst a psát poznámky i offline, aby se po připojení k internetu automaticky synchronizovaly.

### **System Flow**

1. Všechny dešifrované poznámky se ukládají do **IndexedDB** v prohlížeči.
2. Frontend udržuje **šifrovaný sync log** (např. diffs poznámek).
3. Po opětovném připojení:

   * Klient odešle změny do backendu (`POST /sync`)
   * Backend uloží nové ciphertexty.

---

## 🔒 8. Bezpečnostní funkce (2FA, Recovery Code)

### **User Story: 2FA**

> Chci přidat dvoufázové ověření, abych chránil účet před přístupem zcizeným heslem.

**System Flow**

1. Uživatel si vygeneruje TOTP secret (`/2fa/setup`).
2. Backend vrátí QR kód (např. pro Google Authenticator).
3. Uživatel zadá ověřovací kód → backend ověří (`/2fa/verify`).
4. Při přihlášení se pak kromě hesla vyžaduje i TOTP kód.

---

### **User Story: Recovery Code**

> Chci mít možnost obnovit svá data, pokud zapomenu heslo.

**System Flow**

1. Při registraci klient vygeneruje „Recovery Code“ (náhodný klíč).
2. Tento kód se použije pro zašifrování kopie `UMK_private`.
3. Uživatel si ho uloží offline.
4. Pokud zapomene heslo, může použít recovery code k dešifrování `UMK_private`.

---

# 🔁 **Celková pipeline (Shrnutí)**

| Fáze | Akce uživatele     | Co se děje v systému                             |
| ---- | ------------------ | ------------------------------------------------ |
| 1    | Registrace         | Klient generuje klíče a hashe, server je uloží   |
| 2    | Přihlášení         | Server ověří heslo, klient odemkne soukromý klíč |
| 3    | Vytvoření poznámky | Klient šifruje obsah, server ukládá ciphertext   |
| 4    | Čtení poznámky     | Klient dešifruje lokálně                         |
| 5    | Sdílení            | Klient re-encryptuje klíč pro jiného uživatele   |
| 6    | Upload souboru     | Chunkovaná šifrace a upload na S3                |
| 7    | Offline režim      | Lokální cache + synchronizace při reconnectu     |
| 8    | 2FA & Recovery     | Zálohování a posílení bezpečnosti                |

---