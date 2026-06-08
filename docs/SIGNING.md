# Code Signing

Code signing is a future enhancement. Current builds are unsigned.

## What unsigned means for users

**Windows:** SmartScreen shows a warning on first launch ("Windows protected your PC"). Users click "More info" then "Run anyway." This warning appears because the app has no Extended Validation certificate and has not yet accumulated an install reputation. See `docs/INSTALLING.md` for the exact steps.

**Mac:** Gatekeeper blocks the app on first launch ("developer cannot be verified"). Users right-click and choose Open, or allow it via System Settings > Privacy & Security. See `docs/INSTALLING.md` for the exact steps.

## Enabling signing later

### Mac

Requirements:
- Apple Developer account ($99/year at developer.apple.com)
- Developer ID Application certificate issued to your account
- Notarization through Apple's notary service (required on macOS 10.15+)

Uncomment in `electron-builder.yml` under `mac:`:

```yaml
identity: "Developer ID Application: Your Name (TEAMID)"
hardenedRuntime: true
entitlementsInherit: build/entitlements.mac.plist
gatekeeperAssess: false
```

Set these environment variables at build time (do not commit them):

```
APPLE_ID=your@apple.id
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=YOURTEAMID
```

Create `build/entitlements.mac.plist` with the entitlements your app needs. A minimal plist for a tray app:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
</dict>
</plist>
```

### Windows

Requirements:
- OV (Organization Validation) certificate from a CA such as DigiCert or Sectigo. OV certs have a SmartScreen reputation lag of weeks to months until enough installs accumulate.
- EV (Extended Validation) certificate gives immediate clean installs but requires a hardware token (USB dongle) and costs more.

Uncomment in `electron-builder.yml` under `win:`:

```yaml
certificateFile: path/to/cert.pfx
certificatePassword: ${env.WIN_CERT_PASSWORD}
signAndEditExecutable: true
```

Set `WIN_CERT_PASSWORD` as an environment variable at build time. Never commit the certificate file or password.
