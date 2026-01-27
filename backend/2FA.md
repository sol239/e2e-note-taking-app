# Implementace dvoufaktorového ověřování (2FA)

## Přehled

Tato aplikace implementuje dvoufaktorové ověřování založené na Time-based One-Time Password (TOTP) podle standardu RFC 6238. Implementace poskytuje bezpečné přihlašování s dodatečným krokem ověření pomocí aplikací pro autentizaci jako Google Authenticator, Authy nebo podobných aplikací kompatibilních s TOTP.

## Závislosti

Funkce 2FA závisí na následujících Python balíčcích:
- `pyotp`: Pro generování a ověřování TOTP
- `qrcode`: Pro generování QR kódů pro snadné nastavení
- `Pillow`: Knihovna pro zpracování obrázků vyžadovaná qrcode
- `django.core.cache`: Pro dočasné ukládání relací během ověřování 2FA

## Změny databázového modelu

Model `User` v `accounts/models.py` obsahuje následující pole související s 2FA:

```python
totp_secret = models.CharField(max_length=64, blank=True, null=True)
totp_enabled = models.BooleanField(default=False)
recovery_keys = models.TextField(blank=True, null=True)  # JSON seznam záložních kódů
```

## API koncové body

### 1. Nastavení 2FA (`POST /api/accounts/tfa/setup/`)
**Ověření:** Vyžadováno (uživatel musí být přihlášen)

Inicializuje 2FA pro ověřeného uživatele:
- Generuje náhodný 32-znakový base32 TOTP tajný klíč
- Vytváří 5 záložních recovery kódů (10-znakové alfanumerické kódy)
- Generuje QR kód pro snadné nastavení v aplikacích pro autentizaci
- Ukládá tajný klíč a recovery kódy do databáze

**Odpověď:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr": "iVBORw0KGgoAAAANSUhEUgAA...",  // Base64-kódovaný PNG
  "uri": "otpauth://totp/E2E%20Notes%20App:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=E2E%20Notes%20App",
  "recovery_keys": ["ABC123DEF4", "GHI567JKL8", ...]
}
```

### 2. Povolení 2FA (`POST /api/accounts/tfa/enable/`)
**Ověření:** Vyžadováno

Dokončí nastavení 2FA ověřením, že uživatel správně nakonfiguroval svou aplikaci pro autentizaci.

**Tělo požadavku:**
```json
{
  "code": "123456"
}
```

**Proces:**
- Ověří poskytnutý 6-místný TOTP kód proti uloženému tajnému klíči
- Pokud je platný, nastaví `totp_enabled = True` u uživatele
- Vrátí odpověď o úspěchu/chybě

### 3. Zakázání 2FA (`POST /api/accounts/tfa/disable/`)
**Ověření:** Vyžadováno

Úplně zakáže 2FA pro uživatele:
- Nastaví `totp_enabled = False`
- Vymaže `totp_secret`
- Smaže všechny recovery kódy

### 4. Ověření 2FA kódu (`POST /api/accounts/tfa/verify/`)
**Ověření:** Nevyžadováno (používá dočasný token relace)

Používá se během přihlašování, když je 2FA povoleno. Přijímá buď:
- 6-místný TOTP kód z aplikace pro autentizaci
- Jeden z recovery kódů

**Tělo požadavku:**
```json
{
  "temp_token": "ABCDEF123456",
  "code": "123456"
}
```

**Proces:**
- Načte ID uživatele z cache pomocí dočasného tokenu
- Pokud kód odpovídá recovery kódu: úplně zakáže 2FA a vrátí autentizační token
- Pokud je kód platný TOTP: vrátí autentizační token
- Neplatné kódy vrátí chybu

## Tok přihlašování s 2FA

### Normální přihlášení (2FA zakázáno)
1. Uživatel poskytne email/heslo
2. Systém ověří přihlašovací údaje
3. Okamžitě vrátí autentizační token

### Přihlášení s povoleným 2FA
1. Uživatel poskytne email/heslo
2. Systém ověří přihlašovací údaje
3. Pokud `user.totp_enabled == True`, generuje dočasný token relace
4. Uloží ID uživatele do cache s 5-minutovou expirací: `cache.set(f"tfa_{temp_token}", user.id, timeout=300)`
5. Vrátí `{"tfa_required": true, "temp_token": "ABCDEF..."}`
6. Frontend vyzve uživatele k zadání 2FA kódu
7. Uživatel odešle kód na `/api/accounts/tfa/verify/` s temp_token
8. Systém ověří kód a vrátí finální autentizační token

## Bezpečnostní funkce

### Ověření TOTP
- Používá `pyotp.TOTP.verify(code, valid_window=1)` umožňující toleranci ±30 sekund
- Tajné klíče jsou 32-znakové base32 řetězce (160 bitů entropie)

### Recovery kódy
- 5 záložních kódů, každý 10 znaků (velká písmena + číslice)
- Uloženy jako JSON pole v databázi
- Použití recovery kódu automaticky zakáže 2FA (jednorázové použití)

### Správa relací
- Dočasné tokeny expirují po 5 minutách
- Používá Django cache framework pro ukládání
- Tokeny jsou jednorázové a po ověření se smažou

### Generování QR kódu
- Používá standardní TOTP URI formát: `otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}`
- Název vydavatele: "E2E Notes App"
- Název účtu: email uživatele

## Integrace s frontendem

Frontend potřebuje zpracovat následující scénáře:

1. **Tok nastavení:**
   - Zavolat `/api/accounts/tfa/setup/` pro získání QR kódu a recovery kódů
   - Zobrazit QR kód a recovery kódy uživateli
   - Vyzvat k zadání TOTP kódu a zavolat `/api/accounts/tfa/enable/`

2. **Tok přihlašování:**
   - Při přihlášení zkontrolovat, zda odpověď obsahuje `tfa_required: true`
   - Pokud ano, zobrazit formulář pro zadání 2FA
   - Odeslat temp_token + kód na `/api/accounts/tfa/verify/`

3. **Nastavení:**
   - Umožnit uživatelům povolit/zakázat 2FA
   - Zobrazit aktuální stav 2FA
   - Poskytnout možnost regenerace recovery kódů

## Zpracování chyb

- Neplatné TOTP kódy: 400 Bad Request s hláškou "Invalid TOTP"
- Expirované/neplatné dočasné tokeny: 400 Bad Request s hláškou "Session expired or invalid"
- Pokus o povolení bez nastavení: 400 Bad Request s hláškou "TFA not initialized"
- Použití recovery kódu: Automaticky zakáže 2FA a upozorní uživatele

