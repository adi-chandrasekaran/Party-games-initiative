/// <reference types="vite/client" />
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Leaderboard from "./components/Leaderboard";
import Podium from "./components/Podium";
import SimulationView from "./components/SimulationView";
import { platformRequest } from "./platformApi";
import type { BeastPart, Challenge, HostDashboard, LeaderboardEntry, Player, SimulationOutput } from "./types";

const SERVER_URL = import.meta.env.VITE_PLATFORM_API_URL ?? "http://localhost:8787";
const socket = io(`${SERVER_URL}/build-a-beast`, { autoConnect: true, withCredentials: true, transports: ["websocket"] });

type SharedDeck = {
  id: string;
  title: string;
  fileName?: string;
};

const CHALLENGE_OPTIONS = [
  { id: "desert-survival", label: "Biology: Desert Survival Beast" },
  { id: "arctic-adaptation", label: "Biology: Arctic Adaptation Beast" },
  { id: "physics-bridge", label: "Physics: Bridge Builder" },
  { id: "cs-network", label: "Computer Science: Secure Network" },
  { id: "history-civilization", label: "History: Civilization Builder" },
  { id: "chemistry-molecule", label: "Chemistry: Arrange the Molecule" },
  { id: "chaos-monster", label: "Fun: Chaos Monster Arena" }
];

type Role = "host" | "player" | null;
type Mode = "landing" | "host-lobby" | "host-dashboard" | "player-lobby" | "player-build" | "waiting" | "simulation" | "podium";

function PartCard({ part, selected, disabled, onClick }: { part: BeastPart; selected: boolean; disabled: boolean; onClick: () => void }) {
  const statText = Object.entries(part.stats).map(([key, value]) => `${key} ${value > 0 ? "+" : ""}${value}`).join(" · ");
  return (
    <button className={["part-card", selected ? "selected-part" : "", disabled ? "disabled-part" : ""].join(" ")} onClick={onClick} disabled={disabled && !selected}>
      <div className="part-top"><span className="part-category">{part.category}</span><span className="part-cost">Cost {part.cost}</span></div>
      <h3>{part.name}</h3>
      <p>{part.description}</p>
      <small>{statText}</small>
    </button>
  );
}

function WaitingRoom({ leaderboard, dashboard }: { leaderboard: LeaderboardEntry[]; dashboard: HostDashboard | null }) {
  const submitted = dashboard?.room.submittedCount ?? 0;
  const total = dashboard?.room.playerCount ?? 0;
  return (
    <div className="waiting-screen">
      <section className="waiting-card">
        <p className="badge">Build submitted</p>
        <h1>Waiting for the arena...</h1>
        <p className="muted">{submitted}/{total} players have submitted their beasts. The simulation starts automatically when everyone is ready.</p>
        <Leaderboard entries={leaderboard} animated />
      </section>
    </div>
  );
}

function HostDashboardView({ roomId, dashboard, onStart, onRunSimulation, onRestart, onEnd, selectedChallengeId, setSelectedChallengeId, onSetChallenge }: {
  roomId: string; dashboard: HostDashboard | null; onStart: () => void; onRunSimulation: () => void; onRestart: () => void; onEnd: () => void; selectedChallengeId: string; setSelectedChallengeId: (id: string) => void; onSetChallenge: () => void;
}) {
  const challenge = dashboard?.challenge;
  const players = dashboard?.players ?? [];
  return (
    <div className="host-screen">
      <section className="host-topbar">
        <div><p className="muted">Room Code</p><div className="room-code-small">{roomId}</div></div>
        <div><p className="muted">Phase</p><div className="status-pill">{dashboard?.room.phase ?? "lobby"}</div></div>
        <div className="button-row">
          {dashboard?.room.phase === "lobby" && <button className="primary-btn" onClick={onStart}>Start Build Phase</button>}
          {dashboard?.room.phase === "building" && <button className="primary-btn" onClick={onRunSimulation}>Run Simulation Now</button>}
          {dashboard?.room.phase === "podium" && <button className="primary-btn" onClick={onRestart}>Restart</button>}
          <button className="danger-btn" onClick={onEnd}>End Game</button>
        </div>
      </section>

      <main className="host-layout">
        <section className="panel">
          <h2>Challenge</h2>
          <select className="select" value={selectedChallengeId} onChange={(event) => setSelectedChallengeId(event.target.value)} disabled={dashboard?.room.phase === "building"}>
            {CHALLENGE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          <button className="secondary-btn" onClick={onSetChallenge} disabled={dashboard?.room.phase === "building"}>Apply Challenge</button>
          {challenge && <><h3>{challenge.title}</h3><p className="muted">{challenge.description}</p><div className="badge-row"><span className="badge">{challenge.subject}</span><span className="badge">{challenge.mode}</span><span className="badge">{challenge.minParts}-{challenge.maxParts} parts</span></div></>}
        </section>

        <section className="panel">
          <h2>Players</h2>
          <div className="player-grid">
            {players.length === 0 ? <p className="muted">No players yet.</p> : players.map((player) => (
              <div className={player.submitted ? "player-tile submitted" : "player-tile"} key={player.id}>
                <strong>{player.name}</strong><span>{player.status}</span><small>{player.beastName || "No beast yet"}</small><small>{player.selectedPartCount} parts</small>
              </div>
            ))}
          </div>
        </section>

        <section className="panel"><Leaderboard entries={dashboard?.leaderboard ?? []} animated={dashboard?.room.phase === "podium"} /></section>
      </main>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState<Mode>("landing");
  const [role, setRole] = useState<Role>(null);
  const [hostContact, setHostContact] = useState("");
  const [sharedDecks, setSharedDecks] = useState<SharedDeck[]>([]);
  const [selectedStudyDeckId, setSelectedStudyDeckId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [player, setPlayer] = useState<Player | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [selectedChallengeId, setSelectedChallengeId] = useState("desert-survival");
  const [dashboard, setDashboard] = useState<HostDashboard | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [beastName, setBeastName] = useState("");
  const [simulation, setSimulation] = useState<SimulationOutput | null>(null);
  const [toast, setToast] = useState("");
  const roleRef = useRef<Role>(role);
  const playerRef = useRef<Player | null>(player);
  const roomIdRef = useRef(roomId);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  useEffect(() => {
    platformRequest("/api/bootstrap")
      .then((payload) => {
        if (payload?.user?.username) {
          setHostContact(payload.user.username);
        } else if (payload?.user?.name) {
          setHostContact(payload.user.name);
        }
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    platformRequest("/api/decks")
      .then((payload) => {
        setSharedDecks(payload.decks || []);
        const fromUrl = new URLSearchParams(window.location.search).get("deckId");
        if (fromUrl) setSelectedStudyDeckId(fromUrl);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    function resetHome(message?: string) {
      setMode("landing"); setRole(null); setRoomId(""); setJoinCode(""); setPlayer(null); setDashboard(null); setLeaderboard([]); setSelectedParts([]); setBeastName(""); setSimulation(null); if (message) setToast(message);
    }
    function handleDashboard(nextDashboard: HostDashboard) { setDashboard(nextDashboard); setChallenge(nextDashboard.challenge); setSelectedChallengeId(nextDashboard.challenge.id); }
    function handleLeaderboard(entries: LeaderboardEntry[]) { setLeaderboard(entries); }
    function handleChallengeUpdated(nextChallenge: Challenge) { setChallenge(nextChallenge); setSelectedChallengeId(nextChallenge.id); setSelectedParts([]); }
    function handleBuildStarted(payload: { challenge: Challenge }) { setChallenge(payload.challenge); setSelectedChallengeId(payload.challenge.id); setSelectedParts([]); setBeastName(""); if (roleRef.current === "host") setMode("host-dashboard"); if (roleRef.current === "player") setMode("player-build"); }
    function handleAllBuildsSubmitted() { setToast("All beasts submitted. Simulation starting..."); }
    function handleSimulationStarted(payload: { simulation: SimulationOutput }) { setSimulation(payload.simulation); setLeaderboard(payload.simulation.leaderboard); setMode("simulation"); window.setTimeout(() => setMode("podium"), 9000); }
    function handleReturnHome(payload: { reason?: string }) { resetHome(payload.reason ?? "Game ended."); }
    function handleHostDisconnected() { setToast("Host disconnected."); }
    function handleHostTransferred(payload: { playerId: string }) { if (playerRef.current?.id === payload.playerId) { setRole("host"); setMode("host-dashboard"); setToast("You are now the host."); } }
    function resumeRoom() { if (!roomIdRef.current) return; socket.emit("resume-room", { roomId: roomIdRef.current }, (response: any) => { if (!response?.ok) return; if (response.player) setPlayer(response.player); setChallenge(response.challenge); setLeaderboard(response.leaderboard ?? []); setDashboard(response.dashboard ?? null); if (response.isHost) setRole("host"); }); }
    socket.on("host-dashboard", handleDashboard); socket.on("leaderboard", handleLeaderboard); socket.on("challenge-updated", handleChallengeUpdated); socket.on("build-started", handleBuildStarted); socket.on("all-builds-submitted", handleAllBuildsSubmitted); socket.on("simulation-started", handleSimulationStarted); socket.on("return-home", handleReturnHome); socket.on("host-disconnected", handleHostDisconnected); socket.on("host-transferred", handleHostTransferred); socket.on("connect", resumeRoom);
    return () => { socket.off("host-dashboard", handleDashboard); socket.off("leaderboard", handleLeaderboard); socket.off("challenge-updated", handleChallengeUpdated); socket.off("build-started", handleBuildStarted); socket.off("all-builds-submitted", handleAllBuildsSubmitted); socket.off("simulation-started", handleSimulationStarted); socket.off("return-home", handleReturnHome); socket.off("host-disconnected", handleHostDisconnected); socket.off("host-transferred", handleHostTransferred); socket.off("connect", resumeRoom); };
  }, []);

  async function createRoom() {
    try {
      if (!hostContact.trim()) {
        setToast("Enter your AISC username.");
        return;
      }

      const access = await platformRequest("/api/platform/can-host", {
        method: "POST",
        body: { gameId: "build-a-beast", emailOrUsername: hostContact.trim() },
      });

      if (!access.canHost) {
        setToast(access.reason ?? "You are not assigned as a host for this game. Ask Aditi for access.");
        return;
      }

      socket.emit("create-room", { hostName: hostContact || "Host", challengeId: selectedChallengeId, studyDeckId: selectedStudyDeckId }, (response: any) => {
        if (!response.ok) { setToast(response.error ?? "Could not create room."); return; }
        setRole("host"); setRoomId(response.room.id); setChallenge(response.challenge); setMode("host-lobby");
      });
    } catch (error: any) {
      setToast(error?.message ?? "Could not verify host access.");
    }
  }
  function joinRoom() {
    socket.emit("join-room", { roomId: joinCode.trim().toUpperCase(), name: hostContact || "Player" }, (response: any) => {
      if (!response.ok) { setToast(response.error ?? "Could not join room."); return; }
      setRole("player"); setRoomId(response.room.id); setChallenge(response.challenge); setPlayer(response.player); setLeaderboard(response.leaderboard); setMode("player-lobby");
    });
  }
  function setHostChallenge() { socket.emit("set-challenge", { roomId, challengeId: selectedChallengeId }, (response: any) => { if (!response.ok) setToast(response.error ?? "Could not set challenge."); else { setChallenge(response.challenge); setToast("Challenge updated."); } }); }
  function startBuildPhase() { socket.emit("start-build", { roomId }, (response: any) => { if (!response.ok) setToast(response.error ?? "Could not start."); else { setDashboard(response.dashboard); setMode("host-dashboard"); } }); }
  function runSimulationNow() { socket.emit("run-simulation", { roomId }, (response: any) => { if (!response.ok) setToast(response.error ?? "Could not run simulation."); }); }
  function restartGame() { socket.emit("restart-game", { roomId }, (response: any) => { if (!response.ok) setToast(response.error ?? "Could not restart."); else { setDashboard(response.dashboard); setMode("host-dashboard"); } }); }
  function endGame() { socket.emit("end-game", { roomId }, (response: any) => { if (!response.ok) setToast(response.error ?? "Could not end game."); }); }
  function togglePart(partId: string) { if (!challenge) return; setSelectedParts((current) => current.includes(partId) ? current.filter((id) => id !== partId) : current.length >= challenge.maxParts ? current : [...current, partId]); }
  function submitBuild() {
    if (!player || !challenge) return;
    if (!beastName.trim()) { setToast("Name your beast first."); return; }
    socket.emit("submit-build", { roomId, playerId: player.id, beastName: beastName.trim(), selectedPartIds: selectedParts }, (response: any) => {
      if (!response.ok) { setToast(response.error ?? "Could not submit build."); return; }
      setMode("waiting"); setToast("Build submitted.");
    });
  }

  if (mode === "host-lobby" || mode === "host-dashboard") return <HostDashboardView roomId={roomId} dashboard={dashboard} onStart={startBuildPhase} onRunSimulation={runSimulationNow} onRestart={restartGame} onEnd={endGame} selectedChallengeId={selectedChallengeId} setSelectedChallengeId={setSelectedChallengeId} onSetChallenge={setHostChallenge} />;
  if (mode === "player-lobby") return <div className="app-shell"><section className="single-card"><p className="badge">Room {roomId}</p><h1>Waiting for host...</h1><p className="muted">You joined as <strong>{name || "Player"}</strong>. The host will start the build phase.</p>{challenge && <div className="challenge-preview"><h2>{challenge.title}</h2><p>{challenge.description}</p><div className="badge-row"><span className="badge">{challenge.subject}</span><span className="badge">{challenge.minParts}-{challenge.maxParts} parts</span></div></div>}<Leaderboard entries={leaderboard} /></section></div>;
  if (mode === "player-build" && challenge) { const maxReached = selectedParts.length >= challenge.maxParts; return <div className="build-screen"><section className="build-hud"><div><p className="badge">{challenge.subject}</p><h1>{challenge.title}</h1><p className="muted">{challenge.description}</p></div><div className="beast-submit-card"><input className="input" placeholder="Name your beast" value={beastName} onChange={(event) => setBeastName(event.target.value)} /><p className="muted">Selected {selectedParts.length}/{challenge.maxParts}. Minimum {challenge.minParts}.</p><button className="primary-btn" onClick={submitBuild} disabled={selectedParts.length < challenge.minParts}>Submit Beast</button></div></section><section className="part-grid">{challenge.parts.map((part) => <PartCard key={part.id} part={part} selected={selectedParts.includes(part.id)} disabled={maxReached} onClick={() => togglePart(part.id)} />)}</section>{toast && <div className="event-toast">{toast}</div>}</div>; }
  if (mode === "waiting") return <WaitingRoom leaderboard={leaderboard} dashboard={dashboard} />;
  if (mode === "simulation" && simulation) return <SimulationView simulation={simulation} playerId={role === "player" ? player?.id : null} onSkipToPodium={() => setMode("podium")} />;
  if (mode === "podium") return <Podium entries={leaderboard} isHost={role === "host"} onRestart={restartGame} onEnd={endGame} simulation={simulation} playerId={role === "player" ? player?.id : null} />;

  return (
    <div className="app-shell"><main className="landing"><section className="hero-card"><p className="badge">Educational Multiplayer Game</p><h1>Build-a-Beast</h1><p>Build a creature from strange parts, test it against arena events, and prove whose design survives.</p><div className="badge-row"><span className="badge">Biology</span><span className="badge">Physics</span><span className="badge">Computer Science</span><span className="badge">History</span><span className="badge">Chemistry</span></div></section><section className="panel"><div className="form-stack"><h2>Start or Join</h2><input className="input" placeholder="AISC username" value={hostContact} onChange={(event) => setHostContact(event.target.value)} /><select className="select" value={selectedChallengeId} onChange={(event) => setSelectedChallengeId(event.target.value)}>{CHALLENGE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select>{sharedDecks.length > 0 && <select className="select" value={selectedStudyDeckId} onChange={(event) => setSelectedStudyDeckId(event.target.value)}><option value="">Select a shared deck</option>{sharedDecks.map((deck) => <option key={deck.id} value={deck.id}>{deck.title}</option>)}</select>}<button className="primary-btn" onClick={createRoom}>Host Game</button><hr /><input className="input" placeholder="Room code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} /><button className="secondary-btn" onClick={joinRoom}>Join as Player</button>{toast && <p className="muted">{toast}</p>}</div></section></main></div>
  );
}
