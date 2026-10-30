# Multiplayer testing over Wi-Fi

Run both projects on your Mac. Other devices open the frontend's HTTPS Network URL; Vite proxies room HTTP requests and WebSockets to Wrangler on `127.0.0.1:8787`. Room state and Durable Objects stay local. Existing song/database services still require Internet access.

## One-time setup on the Mac

Use Node 24 (`nvm use`). Install [mkcert](https://github.com/FiloSottile/mkcert) with `brew install mkcert`, then run this in `animasters`:

```sh
yarn https:setup
```

This trusts a local certificate authority on the Mac, creates certificates for localhost and the Mac's current IPv4 addresses, and prints the available URLs. Certificates live in the ignored `.certs/` directory. Vite blocks HTTP access to that directory and private certificate files; production builds do not include them.

The only file to transfer to other devices is `.certs/animasters-local-CA.crt`, a copy of the **public root certificate**. Do not transfer `localhost-key.pem` or mkcert's `rootCA-key.pem`.

## Trust the certificate on each test device

Transfer `animasters-local-CA.crt` using AirDrop, USB or another local file-transfer method.

- **iPhone/iPad:** open the certificate, install the downloaded profile in Settings → General → VPN & Device Management, then enable it in Settings → General → About → Certificate Trust Settings → Enable full trust for root certificates. Installing the profile alone is not enough. [Apple instructions](https://support.apple.com/en-gb/102390).
- **Android:** install the file as a **CA certificate**, typically under Settings → Security & privacy → More security settings → Encryption & credentials → Install a certificate. Labels vary by manufacturer; search Settings for “Install a certificate” if needed. Use a browser that trusts user-installed CAs. [Google instructions](https://support.google.com/pixelphone/answer/2844832).
- **Another computer:** import the public CA into that computer/browser's trusted root certificates. The Mac running mkcert is already configured; a browser restart may be needed.

## Start the projects

In `match-generator` (using its locked npm dependencies):

```sh
npm run dev:lan
```

In `animasters`:

```sh
yarn dev:lan
```

Open the **Network** HTTPS URL printed by Vite on every device. For the initial setup it is `https://192.168.1.8:3000`; use the newly printed address if it changes. The frontend uses port 3000 strictly, so stop an existing server on that port first. Ordinary dev commands and production builds keep their existing networking behavior.

LAN mode overrides the browser API URL with `/api`, even if `.env.development.local` points elsewhere. Only `/api/rooms` and its subpaths are proxied; Wrangler's developer/admin routes are not exposed. The browser's WebSocket Origin is preserved while the target Host is set to Wrangler. The backend command computes exact allowed HTTPS origins for this Mac instead of accepting every origin. No cloud configuration, secret file or router forwarding is changed.

Create a new room, share its code, join from another device, and press Ready on each device. Automatic frontend reload and backend code reload still work. Local rooms are separate from deployed rooms, and browser membership is specific to the URL/origin: use the same Network URL consistently when reconnecting.

## When something changes

- After changing Wi-Fi or receiving a different IP, rerun `yarn https:setup` and restart both LAN commands. The CA stays the same, so devices do not need to reinstall it unless the CA itself changes.
- If the page cannot connect, confirm the devices are on the same network, macOS permits incoming connections for Node, and the Wi-Fi is not a guest network that isolates devices.
- A certificate warning means trust/setup is incomplete. Catalog integrity checking and guess IDs require a secure browser context, so fix trust instead of using HTTP or bypassing the warning.
- Stop both commands with Ctrl+C when finished. To remove local CA trust from the Mac later, use `mkcert -uninstall`; remove the installed profile/CA from other devices separately.

The proxy/HTTPS configuration follows [Vite's server options](https://vite.dev/config/server-options). Physical phone playback and suspension still need testing on the actual devices; browser automation cannot measure speaker synchronization.

## Verified locally

A real two-browser smoke test over trusted HTTPS (without ignoring certificate errors) passed creation/join, catalog download and integrity checking, settings updates, shared start timestamps, autocomplete guessing, passing, reconnect and five rounds through final standings. Private certificate requests and disallowed origins returned 403. The frontend suite (67 tests), backend suite (74 tests), production frontend build, lint and type checks passed.
