# AI Fax Triage: Clickable Prototype

A static, dependency-free web prototype of an AI-assisted fax inbox for a clinic. Incoming faxes are auto-filed to the EMR only when the patient match is 100%. Everything else goes through a manual triage flow: confirm the patient, check the extracted fields, then push the fax to the EMR.

**Live prototype:** _add the GitHub Pages or Netlify URL here_
**Figma design file:** https://www.figma.com/design/AGvqWPvrgRozdRlHVYGEXQ/AI-Fax-Triage-System

All patients, clinics, chart numbers, and documents are fictional.

## Flow

| Screen | What happens |
| --- | --- |
| Worklist | Each fax shows its document type and confidence, the top patient match, and its status. |
| Auto-filed (100% match) | The fax was filed automatically. Undo sends it back to triage. |
| Triage step 1: Confirm patient | The AI's candidate charts are listed with match signals (name, DOB, phone). The user picks one or creates a new chart. Next stays disabled until a choice is made. |
| Triage step 2: Check fields | Extracted fields are pre-filled and editable. The user sets urgency and the destination queue. |
| Triage step 3: Push to EMR | A summary of what will be filed. Nothing reaches the EMR until Push to EMR is clicked. |
| Pushed to EMR | Confirmation with an audit line and Undo push. |

## Routing rule

Implemented in `js/rules.js`:

- Auto-file only if the top candidate scores **100%** and there is exactly one candidate.
- Anything else goes to triage, including no-match faxes.

## Open questions for review

- **Document-type confidence does not gate auto-filing.** A 97% lab result with a 100% patient match auto-files. Decide whether a document-type threshold should also apply.
- **100% is strict.** Exact matches on every identifier will be rarer than near-matches, so triage volume will be higher. Measure the share of faxes that auto-file in a real pilot.
- **No-match faxes go to the same triage queue** as low-confidence matches. Decide whether staff need a separate path for creating new charts.
- **The phone-update checkbox defaults to on** in step 3. Overwriting chart data without an explicit choice may be risky.

## Run locally

No build step and no dependencies.

```sh
npm start          # serves the folder at http://localhost:3000
```

Or open `index.html` directly in a browser.

## Tests

```sh
npm test
```

Covers the routing rule and checks that the sample faxes route as designed.

## Structure

```
index.html        app shell
styles.css        styles
js/data.js        fictional sample faxes and candidate charts
js/rules.js       auto-file routing rule (unit tested)
js/app.js         screens, triage flow, and event handling
tests/            rule tests (Node, no dependencies)
```

## Notes

- State is in memory. Reloading the page resets the prototype.
- No real patient information should be added to this repository.
