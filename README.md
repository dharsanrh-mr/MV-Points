# MV Points

A responsive, localStorage-powered Rummy / 7s Point score manager.

## Run
Open `index.html` in any modern browser. No server or build step is required.

## Features
- Dashboard with winners, a dedicated latest-losers section, dashboard artwork, games, members and today's count
- Rummy and 7s Point game modes
- Add/delete members
- Score entry and automatic ranking
- Date, game-type and member history filters
- Individual member statistics
- Game detail and delete
- Dark/light theme
- JSON export/import backup
- Responsive mobile/desktop UI
- GitHub Pages friendly

## GitHub Pages
Upload these files to a repository and enable Pages from the repository's Settings > Pages.

## UI
Premium MV Points black/red/gold casino-style interface with responsive sizing and mobile-first layout.

## 7s Point
7s Point now uses exactly 7 rounds. Round 1 and Round 7 double entered points; rounds 2–6 keep the entered value. Final winner/losers are shown after round 7, and the last-point player is surfaced on Home.


## Fixes in this version
- Fixed dashboard crash caused by a missing `lastPointCard` element.
- Added a dedicated Losers section on the dashboard.
- Added local dashboard artwork (`dashboard-art.svg`).
- Made Clear All reset the 7s Point draft safely.
- Fixed Games page losing your 7s Point player selection when you navigate away mid-draft.
- Fixed stale Rummy score inputs showing on top of the 7s Point round panel (CSS `hidden` was being overridden).
- Fixed Round 1 / Round 7 doubling: any entered value is now doubled (previously only exactly "2" was doubled to 4).
- Fixed "Last Point Member" for 7s Point games — it now correctly shows the player with the overall worst total score (opposite extreme from the winner), matching whichever Winner score rule (High/Low) is set in Settings, instead of just that round's points.

## New features
- Undo for member/game deletion (a few seconds via the toast, before it's gone for good).
- Confirmation prompt before importing a JSON backup, since it replaces all current data.
- Member search box on the Members page.
- Sort control on History: newest, oldest, highest score, lowest score.
- Win-streak badge (🔥) next to a member's name on the dashboard leaderboard.
- Round-by-round score breakdown table in the 7s Point game detail view.
- "Back" button in 7s Point to reopen the previous round for correction before finishing.
