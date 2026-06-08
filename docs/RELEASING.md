# Release Process

ShortPath distributes through GitHub Releases. There is no auto-update. Users get new versions by downloading and reinstalling. The installer replaces the app bundle only; user data in `app.getPath("userData")` is untouched.

## Steps

### 1. Bump the version

Edit `package.json` and increment the `version` field. Follow semver:
- Patch (`0.1.0` → `0.1.1`) for bug fixes.
- Minor (`0.1.0` → `0.2.0`) for new features.
- Major (`0.x.x` → `1.0.0`) for breaking changes.

### 2. Commit and tag

```
git add package.json
git commit -m "chore: bump version to 0.2.0"
git tag v0.2.0
git push origin master --tags
```

### 3. Build installers

Run on the target platform (Windows for NSIS, Mac for DMG):

```
npm run build
npm run dist:win    # produces release/ShortPath Setup x.x.x.exe
npm run dist:mac    # produces release/ShortPath-x.x.x.dmg  (Mac only)
```

Output goes to `release/`. Do not commit this directory — it is gitignored.

### 4. Create a GitHub Release

1. Go to the repository on GitHub and click **Releases > Draft a new release**.
2. Set the tag to `v0.2.0` (use the tag you just pushed).
3. Write a short changelog: what changed, what is fixed.
4. Attach the `.exe` and `.dmg` files from `release/`.
5. Publish.

### 5. Communicate to users

Share the release link. Users download the installer and run it over their existing install. Their data is preserved automatically.

## userData locations

| Platform | Path |
|----------|------|
| Windows  | `%APPDATA%\ShortPath` |
| Mac      | `~/Library/Application Support/ShortPath` |
| Linux    | `~/.config/ShortPath` |

These directories are never touched by the installer.
