# Build-a-Beast

A multiplayer educational/fun game where players build creatures from parts, then watch them survive a simulated arena.

## Core loop

1. Host creates a room.
2. Host chooses a challenge.
3. Players join with a room code.
4. Host starts the build phase.
5. Players choose 5–7 parts and name their beast.
6. Once everyone submits, the survival simulation runs.
7. The game shows event-by-event results and a final podium.

## Tech Stack

- Client: React + TypeScript + Vite
- Server: Node + Express + Socket.IO + TypeScript
- State: in-memory for prototype

## Run locally

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open:

```text
http://localhost:5174
```

Server:

```text
http://localhost:4100
```

## Same-device testing

Open multiple browser tabs at `http://localhost:5174`.

One tab hosts. Other tabs join using the room code.

## Same Wi-Fi testing

If friends join from another laptop/phone, `localhost` will not work for them.

Find your laptop IP:

```bash
ipconfig getifaddr en0
```

Create:

```bash
client/.env
```

Add:

```bash
VITE_SERVER_URL=http://YOUR-LAPTOP-IP:4100
```

Restart:

```bash
pnpm dev
```

Players open:

```text
http://YOUR-LAPTOP-IP:5174
```

## Upgrade ideas

- Add real 3D creatures.
- Add drag-and-drop body assembly.
- Add AI-generated beast summaries.
- Add teacher analytics.
- Add saved challenge decks with Supabase.


## V2 additions

This upgraded version adds:

- Player-facing points board after simulation.
- Event-by-event explanation of what helped and what cost points.
- Final podium also shows each player their personal points board.
- More subject versions:
  - Biology: Desert Survival Beast
  - Biology: Arctic Adaptation Beast
  - Physics: Bridge Builder
  - Computer Science: Secure Network
  - History: Civilization Builder
  - Chemistry: Arrange the Molecule
  - Fun: Chaos Monster Arena
