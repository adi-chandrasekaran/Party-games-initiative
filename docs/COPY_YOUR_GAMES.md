# Copy Your Existing Games Into Party Games

> **Legacy document:** Do not use this copy-based workflow for roadmap work. This canonical
> repository now preserves all product changes directly. Read [`README.md`](README.md) and the
> [`roadmap`](roadmap/README.md) before making changes.

Your Quiz Shooter and Build A Beast games are full apps, not tiny static HTML files. That is fine.

This project keeps each game as its own app inside:

```txt
apps/imposter/
apps/quiz-shooter/
apps/build-a-beast/
```

## Important rule

Do **not** copy `node_modules` or `.git` folders.

They are huge and unnecessary.

---

## Recommended setup

Put your folders next to each other like this:

```txt
Projects/
  party-games/
  imposter-who/
  quiz-shooter/
  build-a-beast/
```

Then run these commands from inside `Projects/`, not inside `party-games/`:

```bash
rsync -av --delete --exclude node_modules --exclude .git "./imposter-who/" "./party-games/apps/imposter/"
rsync -av --delete --exclude node_modules --exclude .git "./quiz-shooter/" "./party-games/apps/quiz-shooter/"
rsync -av --delete --exclude node_modules --exclude .git "./build-a-beast/" "./party-games/apps/build-a-beast/"
```

If your folder names are different, replace the source folder names.

Example:

```bash
rsync -av --delete --exclude node_modules --exclude .git "./Imposter Who/" "./party-games/apps/imposter/"
```

---

## After copying

Go into Party Games:

```bash
cd party-games
```

Install dependencies:

```bash
npm install
npm install --prefix apps/hub
npm install --prefix apps/imposter
npm install --prefix apps/quiz-shooter
npm install --prefix apps/build-a-beast
```

Run everything:

```bash
npm run dev
```

Open:

```txt
http://localhost:5176
```

This project also includes four planner apps under `apps/planner-*`, and they are started automatically by `npm run dev`. They do not need to be copied from the old game folders.

---

## If Quiz Shooter or Build A Beast opens on a different port

Look at the terminal output.

If Quiz Shooter says:

```txt
Local: http://localhost:5173/
```

and Build A Beast says:

```txt
Local: http://localhost:5174/
```

then update this file:

```txt
apps/hub/.env.local
```

Use:

```txt
VITE_IMPOSTER_URL=http://localhost:5181
VITE_QUIZ_SHOOTER_URL=http://localhost:5173
VITE_BUILD_A_BEAST_URL=http://localhost:5174
```

Then restart the hub:

```bash
npm run dev:hub
```

---

## Back button for each game

If a game does not have a back button, add this near the top of its HTML `<body>`:

```html
<button class="partyBackBtn" onclick="window.location.href='http://localhost:5175'">
  ← PARTY GAMES
</button>
```

Then add this CSS to that game's CSS file:

```css
.partyBackBtn {
  position: fixed;
  top: 18px;
  left: 18px;
  z-index: 99999;
  background: white;
  color: #111;
  border: 0;
  border-radius: 14px;
  padding: 12px 18px;
  font-size: 15px;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.35);
}

.partyBackBtn:hover {
  transform: scale(1.05);
}
```
