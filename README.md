# Scriptura Bloomerang Tools

This is a small browser add-on for Bloomerang constituent pages. It does two things:

1. Places a blue "?" icon next to certain field labels. Hovering or tapping the icon shows a short, plain-language explanation of the field and, where relevant, of the value already set on that record.
2. On the read-only profile page, reorders a few sections to the top and collapses the rest to just their heading, so the page is shorter to scan. On the edit page, nothing collapses; sections are only reordered.

You install it once. After that, the actual behavior updates itself automatically, on every browser including Safari, with nothing to reinstall. What you install is a tiny loader that fetches the real logic fresh from GitHub on every page load, the same way it already fetches the help text. Only the loader itself, which should rarely need to change, requires a fresh install when it does.

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

**Yes/No toggle buttons, such as "Initiated by Constituent?"** Bloomerang's own toggle button shows a checkmark even when unchecked, just tinted gray, which reads to a lot of people as "checked, but faded" rather than "not selected." Unchecked now shows a plain empty box instead; checked still shows Bloomerang's own green checkmark, untouched.

## If the icons do not appear, or a section will not expand

- Make sure the userscript manager is turned on and allowed to run on `crm.bloomerang.co`.
- On Chrome specifically, check that **Allow User Scripts** is turned on for Tampermonkey (see step 2 above). This is the most common reason Chrome looks fine but nothing happens.
- Reload the constituent page.
- To check whether the tool is actually loading, open the browser's developer console (right-click the page, Inspect, then the Console tab) and reload. Look for a line starting with `[Scriptura] Core logic`. If you see that, the tool loaded correctly and any remaining issue is elsewhere. If you see `[Scriptura] Could not load Bloomerang Tools from GitHub` instead, something blocked the fetch, most often a network issue or, in principle, a stricter Content Security Policy than expected; send Doug a screenshot of that console error.
- If you still see nothing, contact Doug.

---

## For administrators

The help text lives in `config/tooltips.json`. The actual behavior lives in `bloomerang-tools.core.js`. Both are fetched fresh by staff browsers on every page load, so changes to either take effect immediately, everywhere, with nothing for staff to reinstall. Only `bloomerang-tools.user.js`, the tiny loader that staff actually install, should need a reinstall when it changes, and that should be rare.

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

### Changing the logic

Anything that isn't help text, such as the popup's positioning, or the section reorder and collapse rules, lives in `bloomerang-tools.core.js`. Editing this file works exactly like editing `tooltips.json`: commit, push, and staff have it on their next page load. No version number, no reinstall, on any browser.

```bash
cd /opt/bloomerang-tools
vi bloomerang-tools.core.js
node --check bloomerang-tools.core.js
git commit -am "Describe the change"
git push
```

The section reorder and collapse lists (`PROFILE_COLUMN_ORDER`, `EDIT_SECTION_ORDER`, `KEEP_EXPANDED`) are near the top of this file, each with a short comment. Adding a section name to `KEEP_EXPANDED` keeps it open on the profile; anything not in that list collapses by default, including sections added to Bloomerang later. `CORE_VERSION`, a few lines further down, is worth bumping on any real change; it isn't read by any userscript manager, it only prints to the browser console so you can confirm which copy of the logic a staff member is actually running when troubleshooting.

### Changing the loader

`bloomerang-tools.user.js` is the tiny script staff actually install. Its only job is to fetch `bloomerang-tools.core.js` and run it, so it should very rarely need to change. If it ever does, treat it like the old all-in-one script: bump `@version`, copy the same header into `bloomerang-tools.meta.js`, and check syntax, before pushing.

```bash
cd /opt/bloomerang-tools
vi bloomerang-tools.user.js
node --check bloomerang-tools.user.js
# copy the metadata block (between ==UserScript== and ==/UserScript==) into bloomerang-tools.meta.js
git commit -am "Describe the loader change"
git push
```

Tampermonkey (Firefox, Edge, Chrome) checks the loader's version and updates it automatically. Safari's Userscripts app has a confirmed bug where it can update its displayed version number without actually replacing the script's code, so when the loader itself changes, tell Safari users to delete it in the Userscripts app and reinstall fresh from the link, rather than trusting the update indicator. Because the loader is now this small and should change this rarely, that Safari dance should become a rare event rather than something staff hit with every update, which was the whole reason this loader design exists.

### Why this repo is public

Staff browsers fetch these files anonymously, so the repo has to be public for the help text and script to load without a login. There are no secrets here.

### Layout

```
bloomerang-tools.user.js   The tiny loader staff install. Should rarely change.
bloomerang-tools.core.js   The actual behavior. Edit this often; no reinstall needed.
bloomerang-tools.meta.js   Metadata-only copy of the loader's header, for Safari's update check.
config/tooltips.json       The help text. Edit this often; no reinstall needed.
README.md                  This file.
```
