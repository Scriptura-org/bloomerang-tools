# Scriptura Bloomerang Tools

This is a small browser add-on for Bloomerang constituent pages. It does two things:

1. Places a blue "?" icon next to certain field labels. Hovering or tapping the icon shows a short, plain-language explanation of the field and, where relevant, of the value already set on that record.
2. On the read-only profile page, reorders a few sections to the top and collapses the rest to just their heading, so the page is shorter to scan. On the edit page, nothing collapses; sections are only reordered.

You install it once. After that it stays current on its own in Firefox, Edge, and Chrome. Safari's userscript manager checks for updates too, but has a known bug in its own update process, so treat "revisit the install link" as the reliable way to update there. See "If the icons do not appear."

## Install

You need a userscript manager. Which one depends on your browser.

### Firefox or Edge

1. Install the **Tampermonkey** extension from your browser's add-on store.
2. Click this link: https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
3. Tampermonkey opens an install page. Click **Install**.
4. Open any constituent's Profile page in Bloomerang. You should see blue "?" icons next to some fields.

### Chrome (Mac or Windows)

1. Install the **Tampermonkey** extension from the Chrome Web Store.
2. Chrome has an extra step Firefox and Edge do not need. Right-click the Tampermonkey icon in the toolbar and choose **Manage Extension**. On that page, find and turn on **Allow User Scripts**. Without this, Chrome blocks the script from running even though Tampermonkey looks installed and enabled.
3. Click this link: https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
4. Tampermonkey opens an install page. Click **Install**.
5. Open any constituent's Profile page in Bloomerang. You should see the "?" icons.

### Safari (Mac)

Safari does not run Tampermonkey for free. The free option is an app called **Userscripts**, by Justin Wasack, available on the Mac App Store: https://apps.apple.com/us/app/userscripts/id1463298887. It does the same job.

1. Install **Userscripts** from that App Store link, or by searching "Userscripts" in the Mac App Store app.
2. Open Safari, go to **Safari, Settings, Extensions**, and turn on **Userscripts**. When it asks about permissions, choose **Always Allow** for `crm.bloomerang.co` (or for all websites, if you would rather not be asked again).
3. Click this link: https://raw.githubusercontent.com/Scriptura-org/bloomerang-tools/main/bloomerang-tools.user.js
4. Click the Userscripts icon in Safari's toolbar. It will show an install prompt. Click it to install.
5. Open any constituent's Profile page in Bloomerang. You should see the "?" icons.

## Using it

**Help icons.** Hover the mouse over a "?" icon to read its help. On a touch screen, tap the icon, and tap anywhere else to close it. On the edit page, the popup explains every option for that field. On the profile page, it only explains the value or values already set on that record.

**Purpose, on Interaction, Task, Email, and Letter logging.** The Purpose field always shows every option with its meaning, since you are actively choosing it rather than viewing something already set. A few options do more than describe the contact: Acknowledgement can mark a gift as acknowledged, and Receipt is a specific financial document, not a general thank-you. The icon flags this.

**Section layout, Profile page only.** Donor Relationship, Biographical Details, and Basic Info stay open at the top. Addresses, Emails, Phone Numbers, Communication Preferences, Groups, and Giving Level also stay open, in their normal position. Every other section, including Giving Statements, starts collapsed. Click a collapsed heading to open it; click it again to close it. This does not touch the Summary, Timeline, or Relationships tabs, only the Profile page itself.

**Section layout, Edit page only.** Edit Profile, Donor Relationship, Biographical Details, and Communication Preferences move to the top, in that order. Nothing collapses on the edit page.

## If the icons do not appear, or a section will not expand

- Make sure the userscript manager is turned on and allowed to run on `crm.bloomerang.co`.
- On Chrome specifically, check that **Allow User Scripts** is turned on for Tampermonkey (see step 2 above). This is the most common reason Chrome looks fine but nothing happens.
- Reload the constituent page.
- If a collapsed section will not open when clicked, or you see the old layout after we announce an update, on Safari try the install link again to force a fresh copy, since Safari's own update check is not fully reliable. On Firefox, Edge, and Chrome this should not be necessary, since Tampermonkey checks for updates on its own.
- If you still see nothing, contact Doug.

---

## For administrators

The help text lives in `config/tooltips.json`. Editing that file is the normal, everyday task. The script itself rarely needs to change.

### Editing the help text

Each entry maps a field label to its help text. The label must match what shows on screen (capitals and spacing do not matter, a trailing colon is ignored).

A freeform field just needs an idea:

```json
"Background & Family": {
  "idea": "Notes on this person's background, family connections, and anything that helps staff understand and relate to them."
}
```

A select field, single or multi-value, gives an idea plus one line per option. The option key must exactly match the Bloomerang value label:

```json
"Contribution Type": {
  "idea": "The ways this person takes part in the ministry. You can choose more than one.",
  "options": {
    "Treasure": "Gives money or other financial gifts.",
    "Talent": "Offers a skill, such as writing, design, or professional advice.",
    "Time": "Gives their time, for example by volunteering or helping at events.",
    "Prayer": "Prays for the ministry. This is about praying, not about their main role.",
    "Connector": "Introduces Scriptura to other people who may want to take part."
  }
}
```

On the edit page, every option is shown so staff can choose. On the profile page, only the option or options actually set on that record are shown. To add or retire a value, edit that field's `options` list.

Some fields, like Purpose, only ever appear on active logging forms (Interaction, Task, Email, Letter), not as a static value on the profile. For those, add `"showAllOptions": true` to the field so every option is always shown, regardless of page:

```json
"Purpose": {
  "idea": "The main reason for this task, interaction, email, or letter.",
  "showAllOptions": true,
  "options": {
    "Acknowledgement": "Thanking someone for a gift. This can also mark the gift as acknowledged."
  }
}
```

To publish a help-text change: edit `config/tooltips.json`, commit, and push. Staff get the new text the next time they load a constituent page, usually within a few minutes, and no reinstall is needed on any browser.

```bash
cd /opt/bloomerang-tools
vi config/tooltips.json
git commit -am "Update help text"
git push
```

### Changing the script

If you change `bloomerang-tools.user.js` itself, meaning any code change, not just help text, do three things before you push:

1. Increase the `@version` number near the top of the file.
2. Copy that same metadata block (the lines between `// ==UserScript==` and `// ==/UserScript==`, version included) into `bloomerang-tools.meta.js`, replacing what is there. The two files must always agree.
3. Run `node --check bloomerang-tools.user.js` to confirm there are no syntax errors.

Tampermonkey (Firefox, Edge, Chrome) checks the version and updates everyone automatically. Safari's Userscripts app checks `bloomerang-tools.meta.js` for the same purpose, but its update process has a known bug upstream, so it is worth telling staff directly when a script change goes out, and pointing Safari users back to the install link if their copy looks stale.

The section reorder and collapse lists (`PROFILE_COLUMN_ORDER`, `EDIT_SECTION_ORDER`, `KEEP_EXPANDED`) are near the top of the script, each with a short comment. Adding a section name to `KEEP_EXPANDED` keeps it open on the profile; anything not in that list collapses by default, including sections added to Bloomerang later.

### Why this repo is public

Staff browsers fetch these files anonymously, so the repo has to be public for the help text and script to load without a login. There are no secrets here.

### Layout

```
bloomerang-tools.user.js   The script staff install. Rarely changes.
bloomerang-tools.meta.js   Metadata-only copy of the header above, for Safari's update check.
config/tooltips.json       The help text. Edit this often.
README.md                  This file.
```
