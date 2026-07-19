# BIMI — sender-profile logo (inbox avatar)

BIMI (Brand Indicators for Message Identification) is what makes the DentalStory
logo show up as the **sender avatar** next to our emails in Gmail / Apple Mail /
Yahoo, instead of a grey initial. It is **not** part of the email HTML — it lives
in DNS + a hosted logo + (for the big providers) a certificate.

## What ships in this repo

- `public/bimi/dentalstory-logo.svg` — the BIMI mark: **SVG Tiny 1.2 Portable/Secure**
  (`baseProfile="tiny-ps"`), square `512×512`, white DentalStory tooth on the brand
  teal `#5A8A94`, ~1.5 KB (limit is 32 KB). No script / no external refs / has a
  `<title>` — the format BIMI requires. Once this branch is on prod it is served at:

  `https://dentalstory.ua/bimi/dentalstory-logo.svg`

## What you (the domain owner) must do — one time, in DNS + a cert vendor

BIMI has three hard prerequisites. The logo only appears once **all** are met.

### 1. DMARC must be at enforcement

BIMI is ignored unless the sending domain publishes DMARC at `p=quarantine`
(with `pct=100`) or `p=reject`, with SPF + DKIM aligned and passing (Resend
already signs DKIM/SPF for the sending domain). Check the current policy:

```
dig +short TXT _dmarc.dentalstory.ua
```

If it is `p=none`, raise it to at least `p=quarantine; pct=100` first and let it
settle before enabling BIMI.

### 2. Publish the BIMI DNS record

Add a TXT record on the **same domain the emails are From** (`dentalstory.ua`,
which is what prod sends `noreply@dentalstory.ua` from):

```
Host:  default._bimi.dentalstory.ua
Type:  TXT
Value: v=BIMI1; l=https://dentalstory.ua/bimi/dentalstory-logo.svg; a=
```

- `l=` → the hosted SVG (this repo's asset).
- `a=` → the VMC/CMC certificate URL (see step 3). Leave it empty (`a=`) only for
  a first smoke test; Gmail/Apple/Yahoo will **not** render the avatar without it.

### 3. Get a VMC (or CMC) certificate — required for Gmail / Apple / Yahoo

Gmail, Apple Mail and Yahoo only display the BIMI logo if `a=` points to a
**Verified Mark Certificate** (VMC) — or a **Common Mark Certificate** (CMC) if
the mark isn't a registered trademark. It's a paid annual cert (issued by
DigiCert or Entrust) that cryptographically binds this exact SVG to the domain.

1. Buy a VMC (registered trademark) or CMC (no trademark) from DigiCert/Entrust.
2. They validate the domain + mark and issue a `.pem` bundle.
3. Host it (e.g. `https://dentalstory.ua/bimi/dentalstory-vmc.pem`) and set
   `a=https://dentalstory.ua/bimi/dentalstory-vmc.pem` in the DNS record above.

Without a cert the record is still valid and some smaller clients may show the
logo, but the major inboxes won't.

## Verify

- Record syntax + logo/cert fetch: https://bimigroup.org/bimi-generator/ (Inspector)
- End-to-end: send a test to a Gmail account after DNS propagates (can take up to
  a few hours) and confirm the avatar renders.

## Notes

- Keep the SVG at a stable URL — changing the path means re-issuing the VMC.
- If the logo art changes, the VMC must be re-issued (it's bound to the exact file).
- The in-email header logo (the teal chip in `src/lib/email-templates.ts`) is a
  **separate** thing from this inbox avatar; both should stay visually consistent.
