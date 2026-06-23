# Scriptura Bloomerang Tools

This is a small browser add-on that places a help "?" icon next to fields on a
Bloomerang constituent record. Hovering or tapping the icon shows a short,
plain-language explanation of what the field means and how to use it.

You install it once. After that it stays current on its own, so you never have
to reinstall it when the help text changes.

## Install

You need the **Tampermonkey** userscript manager, which works in all three
browsers. Pick the steps for yours.

### Firefox or Edge

1. Install the **Tampermonkey** extension from your browser's add-on store.
2. Click this link: https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
3. Tampermonkey opens an install page. Click **Install**.
4. Open any constituent in Bloomerang. You should see blue "?" icons next to the
   donor relationship fields.

### Safari (Mac)

1. Install the **Tampermonkey** app from the Mac App Store.
2. Open Safari, go to **Settings, Extensions**, and turn on **Tampermonkey**.
   When asked, allow it to run on `crm.bloomerang.co`.
3. Click this link: https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
4. Tampermonkey opens an install page. Click **Install**.
5. Open any constituent in Bloomerang. You should see the "?" icons.

## Using it

Hover the mouse over a "?" icon to read its help. On a touch screen, tap the
icon, and tap anywhere else to close it. That is all there is to it.

## If the icons do not appear

- Make sure the userscript manager is turned on and is allowed to run on
  `crm.bloomerang.co`.
- Reload the constituent page.
- If you still see nothing, contact Doug.

---

## For administrators

The help text lives in `config/tooltips.json`. Editing that file is the normal,
everyday task. The script itself rarely needs to change.

### Editing the help text

Each entry maps a field label to its help text. The label must match what shows
on screen (capitals and spacing do not matter, a trailing colon is ignored).

A value can be a single line of text used everywhere:

```json
"Affinity Interests": "The topics this person cares about."
```

Or it can give different text on the read-only profile and the edit screen:

```json
"Contribution Type": {
  "view": "How this person takes part.",
  "edit": "Choose every way this person takes part. You can pick more than one."
}
```

To publish a change: edit `config/tooltips.json`, commit, and push. Staff get
the new text the next time they load a constituent page, usually within a few
minutes.

```bash
cd /opt/bloomerang-tools
vi config/tooltips.json
git commit -am "Update help text"
git push
```

### Changing the script

If you change `bloomerang-tools.user.js` itself, increase the `@version` number
near the top of the file before you push. The userscript manager checks that
number and updates everyone automatically.

### Why this repo is public

Staff browsers fetch these files anonymously, so the repo has to be public for
the help text and script to load without a login. There are no secrets here.

### Layout

```
bloomerang-tools.user.js   The script staff install. Rarely changes.
config/tooltips.json       The help text. Edit this often.
README.md                  This file.
```
