import { useEffect, useRef, useState } from "react";
import AdminPage from "./AdminPage";
import { ARCADE_APPS, PLANNER_APPS, resolveHubLaunch } from "./appRegistry";
import "./index.css";

const NAV_ITEMS = [
  { id: "profile", label: "Your profile", icon: "profile" },
  { id: "stats", label: "Your stats", icon: "stats" },
  { id: "private-apps", label: "Private apps", icon: "private" },
  { id: "chats", label: "Chats", icon: "chats" },
  { id: "hub", label: "Home", icon: "hub" },
];

const WORKSPACE_TABS = [
  { id: "arcade", label: "AISC Arcade" },
  { id: "planner", label: "AISC Planner" },
];


const FORGE_HOME_CARDS = [
  {
    id: "profile",
    title: "Profile",
    icon: "profile",
    summary: "Manage your account details, update your avatar, and log out when you're done.",
  },
  {
    id: "arcade",
    title: "Arcade",
    icon: "arcade",
    summary: "Launch the six arcade games and open deck-powered play from a clean Figma-style grid.",
  },
  {
    id: "planner",
    title: "Planner",
    icon: "planner",
    summary: "Open the four planner apps for habits, tasks, timers, and assignments in one place.",
  },
  {
    id: "clubs",
    title: "Clubs",
    icon: "clubs",
    summary: "Browse private club apps and request access to club-created tools and spaces.",
  },
  {
    id: "classes",
    title: "Classes",
    icon: "classes",
    summary: "Browse classroom apps and request access to teacher-created tools and resources.",
  },
  {
    id: "requests",
    title: "Requests",
    icon: "requests",
    summary: "Submit a new app idea to caditi28@aischennai.org for future Forge builds.",
  },
];

const FORGE_UPDATES_MESSAGE = "updates will appear here!";

const SCHOOL_DOMAIN = "@aischennai.org";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const API_BASES = Array.from(new Set([(import.meta.env.VITE_HUB_API_URL || "http://localhost:8787"), (import.meta.env.VITE_PLATFORM_API_URL || "http://localhost:8787")].filter(Boolean)));
const EMPTY_PRIVATE_APP = {
  id: "sample-private-app",
  title: "Sample Private App",
  description: "Placeholder private app for invite requests and access previews.",
  owner: "AISC school admin",
  members: ["School admins"],
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

async function apiRequest(pathname, { method = "GET", body } = {}) {
  let lastError = null;

  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${pathname}`, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        return payload;
      }

      const error = new Error(payload.error || "Request failed");
      error.status = response.status;
      lastError = error;

      if (response.status !== 404) {
        throw error;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Request failed");
}

function Avatar({ user, size = 72, className = "" }) {
  if (user?.avatar) {
    return <img className={`avatarImage ${className}`.trim()} src={user.avatar} alt={user.name || "Profile"} style={{ width: size, height: size }} />;
  }

  return (
    <div className={`avatarFallback ${className}`.trim()} style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="9" r="3.6" fill="none" />
        <path d="M5 20c1.7-4.2 4.5-6.2 7-6.2s5.3 2 7 6.2" fill="none" />
      </svg>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="starRating" role="radiogroup" aria-label="Game rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`starButton ${star <= value ? "isFilled" : ""}`}
          onClick={() => onChange(star)}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function GameIcon({ type }) {
  if (type === "imposter") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <rect x="34" y="37" width="46" height="58" rx="14" fill="#e92b34" stroke="#240044" strokeWidth="6" />
        <rect x="46" y="44" width="30" height="15" rx="8" fill="#8df3ff" stroke="#240044" strokeWidth="4" />
        <rect x="23" y="64" width="19" height="30" rx="8" fill="#e92b34" stroke="#240044" strokeWidth="6" />
        <path d="M38 33 Q58 17 80 33" fill="#333" stroke="#240044" strokeWidth="5" />
        <path d="M31 36 Q59 48 90 36" fill="#333" stroke="#240044" strokeWidth="5" />
        <line x1="59" y1="64" x2="59" y2="84" stroke="#240044" strokeWidth="6" strokeLinecap="round" />
        <line x1="48" y1="68" x2="72" y2="70" stroke="#240044" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "quiz") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <circle cx="38" cy="38" r="17" fill="#ffffff" stroke="#240044" strokeWidth="5" />
        <line x1="38" y1="23" x2="38" y2="53" stroke="#f02b4f" strokeWidth="5" />
        <line x1="23" y1="38" x2="53" y2="38" stroke="#f02b4f" strokeWidth="5" />
        <rect x="47" y="55" width="46" height="22" rx="8" fill="#f4f8ff" stroke="#240044" strokeWidth="5" />
        <circle cx="58" cy="66" r="9" fill="#ffd034" stroke="#240044" strokeWidth="4" />
        <text x="54" y="71" fontSize="14" fontWeight="900" fill="#240044">
          ?
        </text>
        <rect x="35" y="76" width="46" height="13" rx="7" fill="#2356ff" stroke="#240044" strokeWidth="5" />
        <path d="M91 53 L105 43" stroke="#ffe66d" strokeWidth="5" strokeLinecap="round" />
        <path d="M94 64 L110 64" stroke="#ffe66d" strokeWidth="5" strokeLinecap="round" />
        <path d="M91 76 L105 87" stroke="#ffe66d" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "habit") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <rect x="26" y="20" width="68" height="80" rx="18" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <rect x="34" y="31" width="52" height="10" rx="5" fill="#7c3aed" stroke="#240044" strokeWidth="4" />
        <rect x="35" y="51" width="18" height="18" rx="4" fill="#4dd6ff" stroke="#240044" strokeWidth="4" />
        <path d="M41 60l4 4 8-9" fill="none" stroke="#240044" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="60" y="51" width="18" height="18" rx="4" fill="#ffd34d" stroke="#240044" strokeWidth="4" />
        <path d="M66 60l4 4 8-9" fill="none" stroke="#240044" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="35" y="74" width="18" height="18" rx="4" fill="#ff7cc4" stroke="#240044" strokeWidth="4" />
        <path d="M41 83l4 4 8-9" fill="none" stroke="#240044" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M62 79h16" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
        <path d="M62 86h10" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "todo") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <rect x="22" y="22" width="76" height="76" rx="16" fill="#fff1df" stroke="#240044" strokeWidth="6" />
        <rect x="32" y="34" width="48" height="9" rx="4.5" fill="#ff8a3d" stroke="#240044" strokeWidth="4" />
        <rect x="33" y="52" width="16" height="16" rx="4" fill="#ffffff" stroke="#240044" strokeWidth="4" />
        <path d="M37 60l4 4 8-10" fill="none" stroke="#240044" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="54" y="52" width="30" height="16" rx="6" fill="#38bdf8" stroke="#240044" strokeWidth="4" />
        <rect x="33" y="74" width="51" height="10" rx="5" fill="#7c3aed" stroke="#240044" strokeWidth="4" />
        <path d="M86 32v54" stroke="#240044" strokeWidth="4" strokeLinecap="round" />
        <path d="M79 60h14" stroke="#240044" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "timer") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <circle cx="60" cy="64" r="34" fill="#e5f9ff" stroke="#240044" strokeWidth="6" />
        <path d="M45 24h30" stroke="#240044" strokeWidth="8" strokeLinecap="round" />
        <circle cx="60" cy="64" r="20" fill="#ffffff" stroke="#240044" strokeWidth="5" />
        <path d="M60 64l14-8" stroke="#ff8a3d" strokeWidth="6" strokeLinecap="round" />
        <path d="M60 48v6" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
        <path d="M71 35l9-9" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
        <circle cx="60" cy="64" r="6" fill="#240044" />
      </svg>
    );
  }

  if (type === "assignments") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <rect x="20" y="22" width="80" height="76" rx="14" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <rect x="30" y="32" width="60" height="10" rx="4" fill="#ff59c7" stroke="#240044" strokeWidth="4" />
        <path d="M30 53h60" stroke="#240044" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 69h60" stroke="#240044" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 85h60" stroke="#240044" strokeWidth="4" strokeLinecap="round" />
        <path d="M43 49v36" stroke="#240044" strokeWidth="4" strokeLinecap="round" />
        <path d="M65 49v36" stroke="#240044" strokeWidth="4" strokeLinecap="round" />
        <path d="M30 61h60" stroke="#7c3aed" strokeWidth="4" strokeDasharray="5 4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "flashcards") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <rect x="24" y="25" width="58" height="70" rx="14" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <rect x="38" y="35" width="34" height="10" rx="5" fill="#8b5cf6" stroke="#240044" strokeWidth="4" />
        <path d="M37 56h29" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
        <path d="M37 68h22" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
        <path d="M44 76l8 8 14-16" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="56" y="32" width="40" height="58" rx="14" fill="#8b5cf6" stroke="#240044" strokeWidth="6" />
      </svg>
    );
  }

  if (type === "quizbowl") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <circle cx="58" cy="48" r="26" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <path d="M58 32c-7 0-12 4-12 10 0 4 2 7 6 9v5" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="58" cy="70" r="8" fill="#06b6d4" stroke="#240044" strokeWidth="5" />
        <path d="M22 90h76" stroke="#240044" strokeWidth="6" strokeLinecap="round" />
        <path d="M34 84l-8-8" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
        <path d="M86 84l8-8" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "wordmatch") {
    return (
      <svg viewBox="0 0 120 120" className="svgIcon">
        <rect x="18" y="28" width="36" height="20" rx="10" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <rect x="66" y="28" width="36" height="20" rx="10" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <rect x="18" y="72" width="36" height="20" rx="10" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <rect x="66" y="72" width="36" height="20" rx="10" fill="#ffffff" stroke="#240044" strokeWidth="6" />
        <path d="M54 38h12" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
        <path d="M54 82h12" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
        <path d="M48 48L72 72" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="svgIcon">
      <path d="M37 30 L47 14 L56 33" fill="#ffd43b" stroke="#240044" strokeWidth="5" strokeLinejoin="round" />
      <path d="M83 30 L73 14 L64 33" fill="#ffd43b" stroke="#240044" strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="60" cy="64" rx="34" ry="39" fill="#2fd6d6" stroke="#240044" strokeWidth="6" />
      <circle cx="60" cy="52" r="18" fill="#ffffff" stroke="#240044" strokeWidth="5" />
      <circle cx="60" cy="52" r="8" fill="#240044" />
      <circle cx="63" cy="49" r="3" fill="#ffffff" />
      <path d="M42 76 Q60 93 78 76" fill="#ff4b6b" stroke="#240044" strokeWidth="5" />
      <path d="M49 77 L54 85 L59 77 L64 85 L69 77" fill="#ffffff" stroke="#240044" strokeWidth="3" />
      <path d="M30 59 Q15 63 18 83" fill="none" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
      <path d="M90 59 Q105 63 102 83" fill="none" stroke="#240044" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

function hexToRgba(hex, alpha = 1) {
  const normalized = String(hex || "").replace("#", "");
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  const red = Number.isNaN(value) ? 20 : (value >> 16) & 255;
  const green = Number.isNaN(value) ? 24 : (value >> 8) & 255;
  const blue = Number.isNaN(value) ? 39 : value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildCardBackground(accent, theme = "dark") {
  const base = theme === "light" ? "rgba(255, 255, 255, 0.96)" : "rgba(18, 22, 34, 0.98)";
  const shadow = theme === "light" ? 0.05 : 0.08;
  const tint = theme === "light" ? 0.1 : 0.12;
  return `linear-gradient(135deg, ${hexToRgba(accent, shadow)} 0%, ${hexToRgba(accent, tint)} 42%, ${base} 100%)`;
}

function LaunchCard({ item, ctaLabel, onLaunch, theme }) {
  const sharedProps = {
    className: "launchCardButton",
    onClick: onLaunch,
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onLaunch(event);
      }
    },
  };

  const inner = (
    <div className="launchCardShell">
      <div className="launchCardFrame" style={{ backgroundImage: buildCardBackground(item.color, theme) }}>
        <div className="launchCardIcon">
          <GameIcon type={item.icon} />
        </div>
        <div className="launchCardContent">
          <strong className="launchCardTitle">{item.title}</strong>
          <span className="launchCardSubtitle">{item.subtitle}</span>
          <span className="launchCardCta">{ctaLabel}</span>
        </div>
      </div>
    </div>
  );

  return (
    <button type="button" {...sharedProps}>
      {inner}
    </button>
  );
}

function NavIcon({ icon }) {
  if (icon === "arcade") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <path d="M6 10h12" />
        <path d="M8 7h8" />
        <path d="M7 10v6" />
        <path d="M17 10v6" />
        <circle cx="9" cy="14" r="1.1" />
        <circle cx="15" cy="14" r="1.1" />
      </svg>
    );
  }

  if (icon === "planner") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <rect x="4" y="5" width="16" height="15" rx="3" />
        <path d="M4 9h16" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M8 12h3" />
        <path d="M8 16h7" />
      </svg>
    );
  }

  if (icon === "clubs") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <path d="M5 19V9l7-5 7 5v10" />
        <path d="M8 19v-6h8v6" />
        <path d="M10 13h4" />
      </svg>
    );
  }

  if (icon === "classes") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <path d="M4 8l8-4 8 4-8 4-8-4Z" />
        <path d="M7 10v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4" />
        <path d="M20 8v6" />
      </svg>
    );
  }

  if (icon === "requests") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <rect x="4" y="5" width="16" height="14" rx="3" />
        <path d="M5 8l7 5 7-5" />
        <path d="M8 14h8" />
      </svg>
    );
  }

  if (icon === "decks") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <rect x="5" y="6" width="12" height="13" rx="2.5" />
        <path d="M8 10h6" />
        <path d="M8 13h6" />
        <path d="M17 8l2 1.5-2 1.5" />
      </svg>
    );
  }

  if (icon === "profile") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20c1.5-4 4.2-6 7-6s5.5 2 7 6" />
      </svg>
    );
  }

  if (icon === "stats") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-8" />
        <path d="M22 20H2" />
      </svg>
    );
  }

  if (icon === "private") {
    return (
      <svg viewBox="0 0 24 24" className="navIcon">
        <path d="M7 10V8a5 5 0 0 1 10 0v2" />
        <rect x="5" y="10" width="14" height="10" rx="3" />
        <path d="M12 13v3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="navIcon">
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16" cy="8" r="2.5" />
      <circle cx="12" cy="15" r="2.5" />
      <path d="M4 8h0M20 8h0M10 15h4" />
    </svg>
  );
}

function EditPencil() {
  return (
    <svg viewBox="0 0 24 24" className="tinyIcon" aria-hidden="true">
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="M14 6l4 4" />
    </svg>
  );
}

function DeckBubble({ deck, active, onSelect }) {
  return (
    <button type="button" className={`deckBubble ${active ? "active" : ""}`} onClick={onSelect}>
      <span className="deckBubbleMark">X</span>
      <span className="deckBubbleText">
        <strong>{deck.title}</strong>
        <small>{deck.fileName || "Uploaded PDF"}</small>
      </span>
    </button>
  );
}

function HubSidebar({
  activeView,
  setActiveView,
  decks,
  selectedDeckId,
  onSelectDeck,
  onUploadDeck,
  isOwner,
  onCreateGameDraft,
}) {
  const [deckTitle, setDeckTitle] = useState("");
  const [deckFile, setDeckFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || null;

  const submitDeck = async () => {
    if (!deckFile) return;

    setUploading(true);
    try {
      await onUploadDeck({
        title: deckTitle.trim() || deckFile.name.replace(/\.pdf$/i, ""),
        file: deckFile,
      });
      setDeckTitle("");
      setDeckFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <aside className="hubSidebar">
      <div className="sidebarSection">
        <p className="sidebarLabel">Utilities</p>
        {isOwner ? (
          <div className="ownerCreateRow">
            <button type="button" className="ownerPlus" onClick={() => onCreateGameDraft("public")}>+</button>
            <button type="button" className="ownerPlus" onClick={() => onCreateGameDraft("private")}>+</button>
            <div className="ownerCreateLabels">
              <span>public</span>
              <span>private</span>
            </div>
          </div>
        ) : null}
        <div className="sidebarNav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebarNavButton ${activeView === item.id || (item.id === "hub" && activeView === "hub") ? "isActive" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              <span className="dockIconWrap">
                <NavIcon icon={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sidebarSection">
        <div className="sidebarHeadingRow">
          <p className="sidebarLabel">Decks</p>
          {selectedDeck ? <span className="selectedDeckLabel">Selected deck: {selectedDeck.title}</span> : null}
        </div>
        <div className="deckUploadCard">
          <input
            className="deckNameInput"
            value={deckTitle}
            onChange={(event) => setDeckTitle(event.target.value)}
            placeholder="Name this deck"
          />
          <label className="deckFileInput">
            <span>PDF only</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setDeckFile(event.target.files?.[0] || null)}
            />
          </label>
          <button type="button" className="panelButton sidebarUploadButton" onClick={submitDeck} disabled={uploading || !deckFile}>
            {uploading ? "Uploading..." : "Upload deck"}
          </button>
        </div>
        <div className="deckList">
          {decks.length === 0 ? (
            <div className="emptyMini">No decks yet</div>
          ) : (
            decks.map((deck) => (
              <DeckBubble key={deck.id} deck={deck} active={deck.id === selectedDeckId} onSelect={() => onSelectDeck(deck.id)} />
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

function ForgeSidebar({ activeView, setActiveView, user, isOwner, onCreateGameDraft, theme, onToggleTheme }) {
  const items = [
    { id: "profile", label: "Profile", icon: "profile" },
    { id: "arcade", label: "Arcade", icon: "arcade" },
    { id: "planner", label: "Planner", icon: "planner" },
    { id: "clubs", label: "Clubs", icon: "clubs" },
    { id: "classes", label: "Classes", icon: "classes" },
    { id: "requests", label: "Requests", icon: "requests" },
  ];

  return (
    <aside className="forgeSidebar">
      <button
        type="button"
        className={`forgeBrandMark ${activeView === "hub" ? "active" : ""}`}
        aria-label="Forge home"
        onClick={() => setActiveView("hub")}
      >
        F
      </button>

      {isOwner ? (
        <div className="forgeOwnerQuick">
          <button type="button" className="ownerQuickButton" onClick={() => onCreateGameDraft("public")}>
            <span>+</span>
            <small>public</small>
          </button>
          <button type="button" className="ownerQuickButton" onClick={() => onCreateGameDraft("private")}>
            <span>+</span>
            <small>private</small>
          </button>
        </div>
      ) : null}

      <div className="forgeSidebarDivider" />

      <div className="forgeRailGroup">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item forgeRailButton ${activeView === item.id ? "active" : ""}`}
            onClick={() => setActiveView(item.id)}
            aria-label={item.label}
          >
            <NavIcon icon={item.icon} />
            <span className="tooltip">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="forgeSidebarSpacer" />

      <button type="button" className="forgeThemeToggle" onClick={onToggleTheme} aria-label="Toggle theme">
        {theme === "dark" ? "☾" : "☀"}
      </button>

      <button type="button" className={`forgeAvatarButton ${activeView === "profile" ? "active" : ""}`} onClick={() => setActiveView("profile")}>
        <Avatar user={user} size={38} className="forgeAvatar" />
      </button>
    </aside>
  );
}

function ForgeHomePage({ onOpenTab }) {
  return (
    <div className="forgeHomePage">
      <div className="forgeHomeHero">
        <div className="forgeHomeEyebrow">THE FORGE</div>
        <h1>THE FORGE</h1>
        <p className="forgeHomeDescription">
          AISC Forge is a student-built software initiative that forges school ideas into usable digital tools, creating multiplayer learning games, club dashboards, study apps, event systems, and teacher-requested utilities for the AISC community.
        </p>
      </div>

      <div className="forgeHomeUpdates">
        <span>Updates</span>
        <strong>{FORGE_UPDATES_MESSAGE}</strong>
      </div>

      <div className="forgeHomeCardGrid">
        {FORGE_HOME_CARDS.map((card) => (
          <button key={card.id} type="button" className="forgeHomeCard" onClick={() => onOpenTab(card.id)}>
            <span className="forgeHomeCardIcon">
              <NavIcon icon={card.icon} />
            </span>
            <strong>{card.title}</strong>
            <p>{card.summary}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function WorkspaceSidebar({ title, activeTab, onSelectTab }) {
  const tabs = [
    { id: "stats", label: "Stats", icon: "stats" },
    { id: "chats", label: "Chats", icon: "chats" },
    { id: "decks", label: "Decks", icon: "decks" },
  ];

  return (
    <aside className="workspaceSidebar">
      <p className="workspaceSidebarLabel">{title}</p>
      {tabs.map((tab) => (
        <button key={tab.id} type="button" className={`inner-nav-item ${activeTab === tab.id ? "active" : ""}`} onClick={() => onSelectTab(tab.id)}>
          <NavIcon icon={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </aside>
  );
}

function WorkspaceDecksView({ decks, selectedDeckId, onSelectDeck, onUploadDeck }) {
  const [deckTitle, setDeckTitle] = useState("");
  const [deckFile, setDeckFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || null;

  const submitDeck = async () => {
    if (!deckFile) return;
    setUploading(true);
    try {
      await onUploadDeck({
        title: deckTitle.trim() || deckFile.name.replace(/\.pdf$/i, ""),
        file: deckFile,
      });
      setDeckTitle("");
      setDeckFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="workspaceDecks">
      <div className="workspaceCardHeader">
        <div>
          <p className="workspaceEyebrow">Decks</p>
          <h3>Your uploaded decks</h3>
          <p className="workspaceSubcopy">Upload a PDF once and use it in any arcade or planner app.</p>
        </div>
        {selectedDeck ? <div className="selectedDeckPill">Selected: {selectedDeck.title}</div> : null}
      </div>

      <div className="deckUploadCard workspaceUploadCard">
        <input className="deckNameInput" value={deckTitle} onChange={(event) => setDeckTitle(event.target.value)} placeholder="Name this deck" />
        <label className="deckFileInput">
          <span>PDF only</span>
          <input type="file" accept="application/pdf,.pdf" onChange={(event) => setDeckFile(event.target.files?.[0] || null)} />
        </label>
        <button type="button" className="panelButton sidebarUploadButton" onClick={submitDeck} disabled={uploading || !deckFile}>
          {uploading ? "Uploading..." : "Upload deck"}
        </button>
      </div>

      <div className="deckList workspaceDeckList">
        {decks.length === 0 ? <div className="emptyMini">No decks yet</div> : null}
        {decks.map((deck) => (
          <DeckBubble key={deck.id} deck={deck} active={deck.id === selectedDeckId} onSelect={() => onSelectDeck(deck.id)} />
        ))}
      </div>
    </div>
  );
}

function WorkspaceHomeView({ title, subtitle, selectedDeck, items, onLaunchItem, isPlanner = false, theme = "dark" }) {
  return (
    <div className="workspaceHome">
      <div className="workspaceHero">
        <p className="workspaceEyebrow">{title}</p>
        <h1>{isPlanner ? "PLANNER" : "ARCADE"}</h1>
        <h2>{subtitle}</h2>
      </div>

      {selectedDeck ? (
        <div className="selectedDeckBanner workspaceSelectedDeckBanner">
          <span>Selected deck</span>
          <strong>{selectedDeck.title}</strong>
          <small>{selectedDeck.fileName || "Uploaded PDF"}</small>
        </div>
      ) : null}

      <div className="workspaceLauncherGrid">
        {items.map((item) => (
          <LaunchCard
            key={item.id}
            item={item}
            ctaLabel={isPlanner ? "Open →" : "Play →"}
            theme={theme}
            onLaunch={() => onLaunchItem(item)}
          />
        ))}
      </div>
    </div>
  );
}

function CommunityGridView({ title, subtitle, accent, cards }) {
  const [requestedIds, setRequestedIds] = useState([]);

  return (
    <div className="communityPage">
      <div className="workspaceHero compact">
        <p className="workspaceEyebrow">{title}</p>
        <h1>{title.toUpperCase()}</h1>
        <h2>{subtitle}</h2>
      </div>

      <div className="communityGrid">
        {cards.map((card) => {
          const requested = requestedIds.includes(card.id);
          return (
            <article key={card.id} className="communityCard" style={{ borderColor: accent }}>
              <div className="communityCardTop">
                <div className="communityAvatar" style={{ background: accent }}>
                  {card.icon}
                </div>
                <div>
                  <strong>{card.name}</strong>
                  <span>{card.owner}</span>
                </div>
              </div>
              <p>{card.description}</p>
              <div className="communityMeta">
                <span>{card.members}</span>
                <span>{card.visibility}</span>
              </div>
              <button
                type="button"
                className={`panelButton communityAction ${requested ? "isRequested" : ""}`}
                onClick={() => setRequestedIds((current) => (current.includes(card.id) ? current : [...current, card.id]))}
              >
                {requested ? "Request sent" : "Request to join"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function RequestsOnlyView() {
  return (
    <div className="requestOnlyPanel">
      <div className="workspaceHero compact">
        <p className="workspaceEyebrow">Requests</p>
        <h1>REQUESTS</h1>
        <h2>Submit an app idea you need or want to caditi28@aischennai.org and it will be done in a matter of days for you to use with your friends, peers, or students!</h2>
      </div>
    </div>
  );
}

function shuffleList(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function extractDeckEntries(deck) {
  const text = String(deck?.text || "").replace(/[•·]/g, "\n");
  const lines = text
    .split(/\n+/)
    .flatMap((line) => line.split(/\s+-\s+|\s+–\s+|\s+—\s+|:\s+/))
    .map((entry) => entry.trim())
    .map((entry) => entry.replace(/^[\-\d.)\s]+/, ""))
    .filter(Boolean);

  return lines.filter((entry, index) => lines.indexOf(entry) === index);
}

function buildStudyCards(deck) {
  const entries = extractDeckEntries(deck);
  const cards = [];

  for (let index = 0; index < entries.length; index += 2) {
    const term = entries[index];
    const definition = entries[index + 1] || entries[0] || deck?.title || "Deck item";
    if (term) {
      cards.push({
        id: `${deck?.id || "deck"}-${index}`,
        term,
        definition,
      });
    }
  }

  if (cards.length === 0 && deck?.title) {
    cards.push({
      id: `${deck.id}-fallback`,
      term: deck.title,
      definition: deck.fileName || "Uploaded PDF",
    });
  }

  return cards;
}

function buildQuizQuestions(cards) {
  return shuffleList(cards).map((card) => {
    const distractors = shuffleList(cards.filter((entry) => entry.id !== card.id))
      .slice(0, 3)
      .map((entry) => entry.definition);

    return {
      id: card.id,
      term: card.term,
      correct: card.definition,
      options: shuffleList([card.definition, ...distractors]),
    };
  });
}

function ArcadeDeckPicker({ decks, selectedDeckId, onSelectDeck }) {
  return (
    <div className="deckPickerStrip">
      {decks.length === 0 ? (
        <div className="emptyMini">No decks yet</div>
      ) : (
        decks.map((deck) => (
          <button
            key={deck.id}
            type="button"
            className={`deckPickerChip ${deck.id === selectedDeckId ? "isActive" : ""}`}
            onClick={() => onSelectDeck(deck.id)}
          >
            <span className="deckColorDot" />
            {deck.title}
          </button>
        ))
      )}
    </div>
  );
}

function ArcadeFlashcardsGame({ decks, selectedDeckId, onBack, onSelectDeck, onRecordGamePlay }) {
  const [deckId, setDeckId] = useState(selectedDeckId || decks[0]?.id || "");
  const [cards, setCards] = useState(() => buildStudyCards(decks.find((deck) => deck.id === (selectedDeckId || decks[0]?.id || "")) || decks[0] || null));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set());
  const [unknown, setUnknown] = useState(new Set());
  const [done, setDone] = useState(false);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    const nextDeckId = selectedDeckId || decks[0]?.id || "";
    setDeckId(nextDeckId);
  }, [selectedDeckId, decks]);

  useEffect(() => {
    const deck = decks.find((entry) => entry.id === deckId) || decks[0] || null;
    const nextCards = buildStudyCards(deck);
    setCards(nextCards);
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setUnknown(new Set());
    setDone(false);
    setRecorded(false);
  }, [deckId, decks]);

  useEffect(() => {
    if (!done || recorded) return;
    setRecorded(true);
    onRecordGamePlay?.("Flashcards");
  }, [done, recorded, onRecordGamePlay]);

  const activeDeck = decks.find((entry) => entry.id === deckId) || decks[0] || null;
  const card = cards[index] || null;
  const total = cards.length;
  const progress = total > 0 ? ((known.size + unknown.size) / total) * 100 : 0;

  const answer = (correct) => {
    if (!card) return;
    if (correct) setKnown((current) => new Set([...current, card.id]));
    else setUnknown((current) => new Set([...current, card.id]));
    setFlipped(false);
    setTimeout(() => {
      if (index + 1 >= total) setDone(true);
      else setIndex((current) => current + 1);
    }, 120);
  };

  return (
    <div className="arcadeGameView">
      <div className="arcadeGameTopBar">
        <button type="button" className="workspaceBackButton" onClick={onBack}>
          Back to Arcade
        </button>
        <div>
          <h3>Flashcards</h3>
          <p>{activeDeck ? activeDeck.title : "No deck selected"}</p>
        </div>
      </div>

      <ArcadeDeckPicker decks={decks} selectedDeckId={deckId} onSelectDeck={(nextId) => { setDeckId(nextId); onSelectDeck(nextId); }} />

      {!activeDeck ? (
        <div className="emptyState">No deck available.</div>
      ) : done ? (
        <div className="arcadeGameFinish">
          <div className="arcadeGameEmoji">🎉</div>
          <h4>Session Complete</h4>
          <p>{known.size} known · {unknown.size} review</p>
          <button type="button" className="panelButton" onClick={onBack}>Back to Arcade</button>
        </div>
      ) : (
        <>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          <div className="arcadeFlipWrap">
            <button type="button" className={`arcadeFlipCard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped((current) => !current)}>
              <div className="arcadeFlipFace front">
                <span>Term</span>
                <strong>{card?.term || "Deck item"}</strong>
                <small>Tap to reveal</small>
              </div>
              <div className="arcadeFlipFace back">
                <span>Definition</span>
                <strong>{card?.definition || "Review the next item"}</strong>
              </div>
            </button>
          </div>
          {flipped ? (
            <div className="arcadeChoiceRow">
              <button type="button" className="panelButton ghost" onClick={() => answer(false)}>✗ Still learning</button>
              <button type="button" className="panelButton" onClick={() => answer(true)}>✓ Got it</button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function ArcadeQuizGame({ decks, selectedDeckId, onBack, onSelectDeck, onRecordGamePlay }) {
  const [deckId, setDeckId] = useState(selectedDeckId || decks[0]?.id || "");
  const [questions, setQuestions] = useState(() => buildQuizQuestions(buildStudyCards(decks.find((deck) => deck.id === (selectedDeckId || decks[0]?.id || "")) || decks[0] || null)));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    const nextDeckId = selectedDeckId || decks[0]?.id || "";
    setDeckId(nextDeckId);
  }, [selectedDeckId, decks]);

  useEffect(() => {
    const deck = decks.find((entry) => entry.id === deckId) || decks[0] || null;
    const nextQuestions = buildQuizQuestions(buildStudyCards(deck));
    setQuestions(nextQuestions);
    setCurrent(0);
    setSelected("");
    setScore(0);
    setDone(false);
    setAnswered(false);
    setRecorded(false);
  }, [deckId, decks]);

  useEffect(() => {
    if (!done || recorded) return;
    setRecorded(true);
    onRecordGamePlay?.("Quiz Bowl");
  }, [done, recorded, onRecordGamePlay]);

  const activeDeck = decks.find((entry) => entry.id === deckId) || decks[0] || null;
  const question = questions[current] || null;

  const choose = (option) => {
    if (!question || answered) return;
    setSelected(option);
    setAnswered(true);
    if (option === question.correct) setScore((currentScore) => currentScore + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) setDone(true);
    else {
      setCurrent((value) => value + 1);
      setSelected("");
      setAnswered(false);
    }
  };

  return (
    <div className="arcadeGameView">
      <div className="arcadeGameTopBar">
        <button type="button" className="workspaceBackButton" onClick={onBack}>
          Back to Arcade
        </button>
        <div>
          <h3>Quiz Bowl</h3>
          <p>{activeDeck ? activeDeck.title : "No deck selected"}</p>
        </div>
      </div>

      <ArcadeDeckPicker decks={decks} selectedDeckId={deckId} onSelectDeck={(nextId) => { setDeckId(nextId); onSelectDeck(nextId); }} />

      {!activeDeck || questions.length === 0 ? (
        <div className="emptyState">Select a deck with at least two items.</div>
      ) : done ? (
        <div className="arcadeGameFinish">
          <div className="arcadeGameEmoji">🏆</div>
          <h4>Quiz Complete</h4>
          <p>{score} / {questions.length} correct</p>
          <button type="button" className="panelButton" onClick={onBack}>Back to Arcade</button>
        </div>
      ) : (
        <>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(current / questions.length) * 100}%` }} /></div>
          <div className="arcadeQuizQuestion">
            What is the definition of <strong>{question?.term}</strong>?
          </div>
          <div className="arcadeQuizChoices">
            {(question?.options || []).map((option) => (
              <button
                key={option}
                type="button"
                className={`arcadeQuizChoice ${answered && option === question.correct ? "correct" : ""} ${answered && option === selected && option !== question.correct ? "wrong" : ""}`}
                onClick={() => choose(option)}
              >
                {option}
              </button>
            ))}
          </div>
          {answered ? (
            <button type="button" className="panelButton" onClick={next}>
              {current + 1 >= questions.length ? "See Results" : "Next Question"}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

function ArcadeWordMatchGame({ decks, selectedDeckId, onBack, onSelectDeck, onRecordGamePlay }) {
  const [deckId, setDeckId] = useState(selectedDeckId || decks[0]?.id || "");
  const [cards, setCards] = useState(() => shuffleList(buildStudyCards(decks.find((deck) => deck.id === (selectedDeckId || decks[0]?.id || "")) || decks[0] || null)).slice(0, 6));
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedDefinition, setSelectedDefinition] = useState("");
  const [matched, setMatched] = useState(new Set());
  const [wrong, setWrong] = useState("");
  const [done, setDone] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [recorded, setRecorded] = useState(false);

  useEffect(() => {
    const nextDeckId = selectedDeckId || decks[0]?.id || "";
    setDeckId(nextDeckId);
  }, [selectedDeckId, decks]);

  useEffect(() => {
    const deck = decks.find((entry) => entry.id === deckId) || decks[0] || null;
    const nextCards = shuffleList(buildStudyCards(deck)).slice(0, 6);
    setCards(nextCards);
    setSelectedTerm("");
    setSelectedDefinition("");
    setMatched(new Set());
    setWrong("");
    setDone(false);
    setAttempts(0);
    setRecorded(false);
  }, [deckId, decks]);

  useEffect(() => {
    if (!done || recorded) return;
    setRecorded(true);
    onRecordGamePlay?.("Word Match");
  }, [done, recorded, onRecordGamePlay]);

  const activeDeck = decks.find((entry) => entry.id === deckId) || decks[0] || null;
  const terms = shuffleList(cards.map((card) => card.term));
  const definitions = shuffleList(cards.map((card) => card.definition));

  const selectTerm = (term) => {
    if (matched.has(term)) return;
    setSelectedTerm(term);
    setWrong("");
  };

  const selectDefinition = (definition) => {
    if (!selectedTerm) {
      setSelectedDefinition(definition);
      return;
    }

    setAttempts((current) => current + 1);
    const card = cards.find((entry) => entry.term === selectedTerm);
    if (card && card.definition === definition) {
      const nextMatched = new Set([...matched, selectedTerm]);
      setMatched(nextMatched);
      setSelectedTerm("");
      setSelectedDefinition("");
      if (nextMatched.size === cards.length) setDone(true);
    } else {
      setWrong(definition);
      setTimeout(() => {
        setSelectedTerm("");
        setSelectedDefinition("");
        setWrong("");
      }, 500);
    }
  };

  return (
    <div className="arcadeGameView">
      <div className="arcadeGameTopBar">
        <button type="button" className="workspaceBackButton" onClick={onBack}>
          Back to Arcade
        </button>
        <div>
          <h3>Word Match</h3>
          <p>{activeDeck ? activeDeck.title : "No deck selected"}</p>
        </div>
      </div>

      <ArcadeDeckPicker decks={decks} selectedDeckId={deckId} onSelectDeck={(nextId) => { setDeckId(nextId); onSelectDeck(nextId); }} />

      {!activeDeck || cards.length === 0 ? (
        <div className="emptyState">Select a deck to start matching.</div>
      ) : done ? (
        <div className="arcadeGameFinish">
          <div className="arcadeGameEmoji">⚡</div>
          <h4>All Matched</h4>
          <p>{attempts} attempts for {cards.length} pairs</p>
          <button type="button" className="panelButton" onClick={onBack}>Back to Arcade</button>
        </div>
      ) : (
        <>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${(matched.size / cards.length) * 100}%` }} /></div>
          <div className="arcadeMatchGrid">
            <div>
              <div className="arcadeMatchLabel">Terms</div>
              {terms.map((term) => (
                <button
                  key={term}
                  type="button"
                  className={`arcadeMatchChip ${matched.has(term) ? "matched" : selectedTerm === term ? "selected" : ""}`}
                  onClick={() => selectTerm(term)}
                >
                  {matched.has(term) ? "✓ " : ""}{term}
                </button>
              ))}
            </div>
            <div>
              <div className="arcadeMatchLabel">Definitions</div>
              {definitions.map((definition) => (
                <button
                  key={definition}
                  type="button"
                  className={`arcadeMatchChip ${wrong === definition ? "wrong" : ""}`}
                  onClick={() => selectDefinition(definition)}
                >
                  {definition}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ForgeShell({
  user,
  stats,
  chats,
  decks,
  games,
  activeView,
  setActiveView,
  onLogout,
  onUpdateProfile,
  onGameClick,
  onRequestInvite,
  onCreateDirectChat,
  onCreateGroupChat,
  onSendMessage,
  onSearchUsers,
  onRateGame,
  selectedDeckId,
  onSelectDeck,
  onUploadDeck,
  isOwner,
  onCreateGameDraft,
  onRecordGamePlay,
}) {
  const [theme, setTheme] = useState(() => window.localStorage.getItem("forge.theme") || "dark");
  const [workspaceTabs, setWorkspaceTabs] = useState({ arcade: "home", planner: "home" });
  const [activeArcadeGame, setActiveArcadeGame] = useState("");
  const [ratingDraft, setRatingDraft] = useState({ game: "", stars: {} });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(chats.threads[0]?.id || "");

  useEffect(() => {
    document.documentElement.setAttribute("data-forge-theme", theme);
    window.localStorage.setItem("forge.theme", theme);
  }, [theme]);

  useEffect(() => {
    setActiveThreadId(chats.threads[0]?.id || "");
  }, [chats.threads]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
        }
        const result = await onSearchUsers(searchQuery);
        if (!cancelled) setSearchResults(result.users || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onSearchUsers, searchQuery]);

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || null;
  const arcadeGames = games;
  const currentWorkspace = activeView === "planner" ? "planner" : "arcade";
  const currentTab = workspaceTabs[currentWorkspace];
  const setCurrentTab = (tab) => {
    setWorkspaceTabs((prev) => ({ ...prev, [currentWorkspace]: tab }));
    if (currentWorkspace === "arcade" && tab !== "home") {
      setActiveArcadeGame("");
    }
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const selectView = (view) => {
    setActiveView(view);
    setActiveArcadeGame("");
    if (view === "arcade" || view === "planner") {
      setWorkspaceTabs((prev) => ({ ...prev, [view]: "home" }));
    }
  };

  const arcadeHome = () => (
    <WorkspaceHomeView
      title="Arcade"
      subtitle="Pick a game and jump in."
      selectedDeck={selectedDeck}
      items={arcadeGames}
      theme={theme}
      onLaunchItem={(item) => {
        if (item.launchMode === "legacy-external") return onGameClick(item);
        setActiveArcadeGame(item.id);
        return onRecordGamePlay?.(item.title);
      }}
      isPlanner={false}
    />
  );

  const plannerHome = () => (
    <WorkspaceHomeView
      title="Planner"
      subtitle="Pick a planner app and jump in."
      selectedDeck={selectedDeck}
      items={PLANNER_APPS}
      theme={theme}
      onLaunchItem={onGameClick}
      isPlanner
    />
  );

  const renderWorkspaceContent = () => {
    if (currentWorkspace === "arcade" && activeArcadeGame === "flashcards") {
      return (
        <ArcadeFlashcardsGame
          decks={decks}
          selectedDeckId={selectedDeckId}
          onBack={() => setActiveArcadeGame("")}
          onSelectDeck={onSelectDeck}
          onRecordGamePlay={onRecordGamePlay}
        />
      );
    }

    if (currentWorkspace === "arcade" && activeArcadeGame === "quiz-bowl") {
      return (
        <ArcadeQuizGame
          decks={decks}
          selectedDeckId={selectedDeckId}
          onBack={() => setActiveArcadeGame("")}
          onSelectDeck={onSelectDeck}
          onRecordGamePlay={onRecordGamePlay}
        />
      );
    }

    if (currentWorkspace === "arcade" && activeArcadeGame === "word-match") {
      return (
        <ArcadeWordMatchGame
          decks={decks}
          selectedDeckId={selectedDeckId}
          onBack={() => setActiveArcadeGame("")}
          onSelectDeck={onSelectDeck}
          onRecordGamePlay={onRecordGamePlay}
        />
      );
    }

    if (currentTab === "stats") {
      return <StatsPage stats={stats} games={currentWorkspace === "planner" ? PLANNER_APPS : arcadeGames} onRateGame={onRateGame} ratingDraft={ratingDraft} setRatingDraft={setRatingDraft} currentUserId={user.id} />;
    }

    if (currentTab === "chats") {
      return (
        <ChatsPage
          threads={chats.threads}
          searchQuery={searchQuery}
          searchResults={searchResults}
          onSearch={setSearchQuery}
          onCreateDirectChat={async (recipientId) => {
            const thread = await onCreateDirectChat(recipientId);
            if (thread?.id) setActiveThreadId(thread.id);
            setCurrentTab("chats");
          }}
          onCreateGroupChat={async (groupName, memberIds) => {
            const thread = await onCreateGroupChat(groupName, memberIds);
            if (thread?.id) setActiveThreadId(thread.id);
            setCurrentTab("chats");
          }}
          onSelectThread={setActiveThreadId}
          activeThread={chats.threads.find((thread) => thread.id === activeThreadId) || chats.threads[0] || null}
          onSendMessage={onSendMessage}
        />
      );
    }

    if (currentTab === "decks") {
      return <WorkspaceDecksView decks={decks} selectedDeckId={selectedDeckId} onSelectDeck={onSelectDeck} onUploadDeck={onUploadDeck} />;
    }

    return currentWorkspace === "planner" ? plannerHome() : arcadeHome();
  };

  const clubs = [
    { id: "club-1", name: "Debate Society", owner: "Club lead", icon: "🎤", description: "Request-to-join tools for debate prep, speaking drills, and hosted events.", members: "Members: invited only", visibility: "Private app" },
    { id: "club-2", name: "Robotics Club", owner: "Club lead", icon: "🤖", description: "Private apps for build logs, testing plans, and competition checklists.", members: "Members: invited only", visibility: "Private app" },
    { id: "club-3", name: "Photography Club", owner: "Club lead", icon: "📷", description: "Private folders and creation tools for shared shoots and editing sessions.", members: "Members: invited only", visibility: "Private app" },
  ];

  const classes = [
    { id: "class-1", name: "AP Biology", owner: "Teacher host", icon: "🧬", description: "Classroom apps for labs, revision, and teacher-led resources.", members: "Members: classroom only", visibility: "Private app" },
    { id: "class-2", name: "Pre-Calculus", owner: "Teacher host", icon: "📐", description: "Shared class tools for practice, notes, and assignment support.", members: "Members: classroom only", visibility: "Private app" },
    { id: "class-3", name: "World History", owner: "Teacher host", icon: "🌍", description: "Private class apps for timelines, prompts, and document sharing.", members: "Members: classroom only", visibility: "Private app" },
  ];

  return (
    <main className="forgeShell">
      <ForgeSidebar activeView={activeView} setActiveView={selectView} user={user} isOwner={isOwner} onCreateGameDraft={onCreateGameDraft} theme={theme} onToggleTheme={toggleTheme} />
      <section className="forgeMain">
        {activeView === "hub" ? (
          <div className="pagePanel forgeHomePanel">
            <ForgeHomePage onOpenTab={selectView} />
          </div>
        ) : activeView === "arcade" || activeView === "planner" ? (
          <div className="workspaceShell">
            <WorkspaceSidebar title={currentWorkspace === "planner" ? "Planner" : "Arcade"} activeTab={currentTab} onSelectTab={setCurrentTab} />
            <div className="workspaceStage">
              {currentTab !== "home" ? (
                <button type="button" className="workspaceBackButton" onClick={() => setCurrentTab("home")}>
                  Back to {currentWorkspace === "planner" ? "Planner" : "Arcade"}
                </button>
              ) : null}
              {renderWorkspaceContent()}
            </div>
          </div>
        ) : activeView === "profile" ? (
          <div className="pagePanel">
            <ProfilePage user={user} stats={stats} onLogout={onLogout} onUpdateProfile={onUpdateProfile} />
          </div>
        ) : activeView === "clubs" ? (
          <CommunityGridView title="Clubs" subtitle="Club apps and tools (private and request to join based)." accent="#06b6d4" cards={clubs} />
        ) : activeView === "classes" ? (
          <CommunityGridView title="Classes" subtitle="Classroom apps (private and request to join based)." accent="#7c3aed" cards={classes} />
        ) : (
          <RequestsOnlyView />
        )}
      </section>
    </main>
  );
}

function LoginCard({ onGoogleSignIn }) {
  const [role, setRole] = useState("member");
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("");
  const [error, setError] = useState("");
  const mountRef = useRef(null);

  useEffect(() => {
    setError("");
  }, [role]);

  const submitLocalAuth = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.endsWith(SCHOOL_DOMAIN)) {
      setError("Use an @aischennai.org email address.");
      return;
    }

    try {
      if (mode === "signup") {
        const response = await apiRequest("/api/signup", {
          method: "POST",
          body: {
            name: name.trim(),
            username: username.trim(),
            email: normalizedEmail,
            password,
            avatar: avatar.trim(),
          },
        });
        window.location.reload();
        return response;
      }

      if (mode === "reset-password") {
        await apiRequest("/api/reset-password", {
          method: "POST",
          body: { email: normalizedEmail, password, confirmPassword },
        });
        setMode("login");
        setError("Password updated. Please log in again.");
        return;
      }

      await apiRequest("/api/login", {
        method: "POST",
        body: { email: normalizedEmail, password },
      });
      window.location.reload();
    } catch (authError) {
      setError(authError.message || "Authentication failed.");
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !mountRef.current) return undefined;

    const setup = () => {
      if (!window.google?.accounts?.id || !mountRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          onGoogleSignIn(role, response.credential, setError);
        },
      });
      mountRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(mountRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        width: 340,
        text: "signin_with",
      });
    };

    const scriptId = "google-identity-script";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = setup;
      document.head.appendChild(script);
    } else if (window.google?.accounts?.id) {
      setup();
    } else {
      script.addEventListener("load", setup, { once: true });
    }

    return () => {
      script?.removeEventListener?.("load", setup);
    };
  }, [onGoogleSignIn, role]);

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authPill">AISC access only</div>
        <h3>Sign in with Google</h3>
        <p>Choose whether you are an AISC member or the owner, then continue with Google authorization.</p>

        <div className="roleToggle">
          <button type="button" className={`miniToggle ${role === "member" ? "on" : ""}`} onClick={() => setRole("member")}>
            AISC member
          </button>
          <button type="button" className={`miniToggle ${role === "owner" ? "on" : ""}`} onClick={() => setRole("owner")}>
            Owner
          </button>
        </div>

        <p className="authHelper">
          {role === "owner" ? "Owner access is limited to caditi28@aischennai.org." : "Only verified @aischennai.org Google accounts can access the hub."}
        </p>

        {!GOOGLE_CLIENT_ID ? <div className="authError">Set `VITE_GOOGLE_CLIENT_ID` in the hub frontend and `GOOGLE_CLIENT_ID` on the backend.</div> : null}
        {error ? <div className="authError">{error}</div> : null}
        <div ref={mountRef} className="googleButtonMount" />

        <div className="localAuthFallback">
          <div className="authDivider">Local fallback login</div>
          <form className="authForm" onSubmit={submitLocalAuth}>
            {mode === "signup" ? (
              <>
                <label>
                  <span>Name</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" />
                </label>
                <label>
                  <span>Username</span>
                  <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="your_username" />
                </label>
              </>
            ) : null}
            <label>
              <span>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@aischennai.org" type="email" />
            </label>
            <label>
              <span>Password</span>
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "reset-password" ? "New password" : "Password"} type="password" />
            </label>
            {mode === "reset-password" ? (
              <label>
                <span>Confirm new password</span>
                <input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" type="password" />
              </label>
            ) : null}
            {mode === "signup" ? (
              <label>
                <span>Profile picture URL or data URL (optional)</span>
                <input value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://..." />
              </label>
            ) : null}
            <button type="submit" className="authSubmit">
              {mode === "signup" ? "Create account" : mode === "reset-password" ? "Reset password" : "Log in"}
            </button>
          </form>
          <button
            type="button"
            className="authSwitch"
            onClick={() => setMode(mode === "reset-password" ? "login" : mode === "signup" ? "login" : "signup")}
          >
            {mode === "signup" ? "Already have an account? Log in" : mode === "reset-password" ? "Back to log in" : "Need a new account? Sign up"}
          </button>
          {mode === "login" ? (
            <button type="button" className="authSwitch secondary" onClick={() => setMode("reset-password")}>
              Forgot password?
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ user, stats, onLogout, onUpdateProfile }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setUsername(user?.username || "");
    setAvatar(user?.avatar || "");
  }, [user]);

  const saveProfile = async () => {
    try {
      await onUpdateProfile({ username, avatar });
      setMessage("Profile updated.");
      setEditing(false);
    } catch (error) {
      setMessage(error.message || "Unable to update profile.");
    }
  };

  const loadAvatarFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="profilePage">
      <div className="profilePageHeader">
        <div>
          <h3>PROFILE</h3>
          <p>Manage your account information</p>
        </div>
        <button type="button" className="iconButton small" onClick={() => setEditing((current) => !current)} aria-label="Edit profile">
          <EditPencil />
        </button>
      </div>

      <div className="profileSummaryCard">
        <Avatar user={user} size={72} className="profileSummaryAvatar" />
        <div className="profileSummaryCopy">
          <strong>{user?.name || "Not set"}</strong>
          <span>@{user?.username || "username"}</span>
          <div className="profileBadge">✓ AIS Chennai</div>
        </div>
      </div>

      <div className="profileDetailsCard">
        <div className="profileDetailField">
          <span>FULL NAME</span>
          <strong>{user?.name || "Not set"}</strong>
        </div>
        <div className="profileDetailField">
          <span>USERNAME</span>
          {editing ? <input value={username} onChange={(event) => setUsername(event.target.value)} /> : <strong>{user?.username || "Not set"}</strong>}
        </div>
        <div className="profileDetailField">
          <span>EMAIL</span>
          <strong>{user?.email || "Not set"}</strong>
        </div>
        <div className="profileDetailField">
          <span>PASSWORD</span>
          <strong className="maskedPassword">••••••••••••</strong>
        </div>
        {editing ? (
          <div className="profileInlineEditor">
            <label>
              <span>CHANGE PROFILE ICON</span>
              <input type="file" accept="image/*" onChange={loadAvatarFile} />
            </label>
            <div className="editActions">
              <button type="button" className="panelButton" onClick={saveProfile}>
                Save changes
              </button>
              <button
                type="button"
                className="authSwitch"
                onClick={() => {
                  setEditing(false);
                  setMessage("");
                  setUsername(user?.username || "");
                  setAvatar(user?.avatar || "");
                }}
              >
                Cancel
              </button>
            </div>
            {message ? <div className="inlineMessage profileInlineMessage">{message}</div> : null}
          </div>
        ) : null}
      </div>

      <div className="profileStatsCard">
        <div className="profileStatTile">
          <span>🎮</span>
          <strong>{stats?.gamesPlayed ?? stats?.games_played ?? "31"}</strong>
          <small>Games Played</small>
        </div>
        <div className="profileStatTile">
          <span>✅</span>
          <strong>{stats?.tasksDone ?? stats?.tasks_done ?? "23"}</strong>
          <small>Tasks Done</small>
        </div>
        <div className="profileStatTile">
          <span>🔥</span>
          <strong>{stats?.studyStreak ?? stats?.study_streak ?? "5 days"}</strong>
          <small>Study Streak</small>
        </div>
      </div>

      <div className="profileLogoutCard">
        <button type="button" className="panelButton ghost profileLogoutButton" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </div>
  );
}

function StatsPage({ stats, games, onRateGame, ratingDraft, setRatingDraft, currentUserId }) {
  const mostRecent = stats.recentGame || null;
  const mostPlayed = stats.mostPlayedGame || null;
  const hubMostPopular = stats.hubMostPopularGame || null;
  const savedRating = ratingDraft.game ? stats.ratings?.find((rating) => rating.userId === currentUserId && rating.game === ratingDraft.game) : null;

  return (
    <div className="panelCard">
      <h3>Your stats</h3>
      <div className="statsGrid threeUp">
        <div className="statTile">
          <span>Most recent game played</span>
          <strong>{mostRecent ? mostRecent.title : "No games yet"}</strong>
        </div>
        <div className="statTile">
          <span>Most played game by you</span>
          <strong>{mostPlayed ? mostPlayed.title : "No games yet"}</strong>
        </div>
        <div className="statTile">
          <span>Most popular game on the hub</span>
          <strong>{hubMostPopular ? hubMostPopular.title : "No games yet"}</strong>
        </div>
      </div>

      <div className="ratingCard">
        <div>
          <span>Game ratings</span>
          <p>Rate a game with five stars if you want to leave feedback.</p>
        </div>
        <div className="ratingPicker">
          <select value={ratingDraft.game} onChange={(event) => setRatingDraft((current) => ({ ...current, game: event.target.value }))}>
            <option value="">Choose a game</option>
            {games.map((game) => (
              <option key={game.id} value={game.title}>
                {game.title}
              </option>
            ))}
          </select>
          <StarRating
            value={savedRating?.stars || ratingDraft.stars[ratingDraft.game] || 0}
            onChange={(stars) => setRatingDraft((current) => ({ ...current, stars: { ...current.stars, [ratingDraft.game]: stars } }))}
          />
        </div>
        <button
          type="button"
          className="panelButton"
          onClick={() => {
            const stars = ratingDraft.stars[ratingDraft.game];
            if (!ratingDraft.game || !stars) return;
            onRateGame(ratingDraft.game, stars);
          }}
        >
          Save rating
        </button>
      </div>
    </div>
  );
}

function PrivateAppsPage({ invites, memberships, allApps, onOpenApp }) {
  return (
    <div className="panelCard privateAppsPanel">
      <h3>Private apps</h3>
      <div className="privateAppsColumns">
        <section className="privateColumn sideColumn">
          <h4>Invites you have not accepted</h4>
          {invites.length === 0 ? (
            <div className="emptyState compact">no invites yet</div>
          ) : (
            invites.map((invite) => (
              <div key={invite.id} className="inviteRow">
                <strong>{invite.title}</strong>
                <span>Owner: {invite.owner}</span>
              </div>
            ))
          )}
        </section>

        <section className="privateColumn sideColumn">
          <h4>Private apps you can access</h4>
          {memberships.length === 0 ? (
            <div className="emptyState compact">no private apps yet</div>
          ) : (
            memberships.map((app) => (
              <div key={app.id} className="inviteRow">
                <strong>{app.title}</strong>
                <span>Owner: {app.owner}</span>
              </div>
            ))
          )}
        </section>

        <section className="privateColumn mainColumn">
          <h4>All private apps</h4>
          <div className="privateGrid">
            {allApps.map((app) => (
              <button key={app.id} type="button" className="privateCard" onClick={() => onOpenApp(app)}>
                <strong>{app.title}</strong>
                <span>{app.owner}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PrivateAppDetailPage({ app, requestedIds, onBack, onRequestInvite }) {
  if (!app) {
    return null;
  }

  return (
    <div className="panelCard privateAppDetailPage">
      <div className="privateAppDetailHeader">
        <div>
          <h3>{app.title}</h3>
          <p>Private app details</p>
        </div>
        <button type="button" className="panelButton ghost" onClick={onBack}>
          Back to private apps
        </button>
      </div>

      <div className="privateDetail">
        <div>
          <span>Description</span>
          <strong>{app.description}</strong>
        </div>
        <div>
          <span>Owner</span>
          <strong>{app.owner}</strong>
        </div>
        <div>
          <span>Members</span>
          <strong>{app.members.join(", ")}</strong>
        </div>
        <button type="button" className="panelButton" onClick={() => onRequestInvite(app.id)}>
          {requestedIds.includes(app.id) ? "Invite requested" : "Request invite"}
        </button>
      </div>
    </div>
  );
}

function ChatsPage({ threads, searchQuery, searchResults, onSearch, onCreateDirectChat, onCreateGroupChat, onSelectThread, activeThread, onSendMessage }) {
  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [messageDraft, setMessageDraft] = useState("");

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => searchResults.some((person) => person.id === id)));
  }, [searchResults]);

  const noPeople = threads.length === 0 && searchResults.length === 0;

  return (
    <div className="panelCard chatsPanel">
      <div className="chatHeader">
        <h3>Chats</h3>
        <div className="chatActions">
          <button type="button" className={`iconButton ${!groupMode ? "active" : ""}`} onClick={() => setGroupMode(false)} aria-label="New chat">
            +
          </button>
          <button type="button" className={`iconButton ${groupMode ? "active" : ""}`} onClick={() => setGroupMode(true)} aria-label="New group chat">
            ☰
          </button>
        </div>
      </div>

      <input className="chatSearch" value={searchQuery} onChange={(event) => onSearch(event.target.value)} placeholder="Search AISC email ids" />

      <div className="chatLayout">
        <div className="chatSidebar">
          <div className="chatSectionLabel">Recent threads</div>
          <div className="chatList">
            {threads.length === 0 ? (
              <div className="emptyMini">no friends yet</div>
            ) : (
              threads.map((thread) => (
                <button key={thread.id} type="button" className={`threadRow ${activeThread?.id === thread.id ? "isActive" : ""}`} onClick={() => onSelectThread(thread.id)}>
                  <Avatar user={{ name: thread.name }} size={36} />
                  <div>
                    <strong>{thread.name}</strong>
                    <span>{thread.memberIds.length} people</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="chatSectionLabel">Search results</div>
          <div className="chatList">
            {searchResults.length === 0 ? (
              <div className="emptyMini">no friends yet</div>
            ) : (
              searchResults.map((person) => (
                <button key={person.id} type="button" className="chatRow" onClick={() => onCreateDirectChat(person.id)}>
                  <Avatar user={person} size={44} />
                  <div>
                    <strong>{person.name}</strong>
                    <span>{person.email}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="chatThread">
          {groupMode ? (
            <div className="groupComposer">
              <h4>Create a group</h4>
              <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="Group name" />
              <div className="groupPeople">
                {searchResults.length === 0 ? (
                  <div className="emptyMini">no friends yet</div>
                ) : (
                  searchResults.map((person) => (
                    <label key={person.id} className="groupPerson">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(person.id)}
                        onChange={(event) => {
                          setSelectedIds((current) => (event.target.checked ? [...current, person.id] : current.filter((id) => id !== person.id)));
                        }}
                      />
                      <span>{person.name}</span>
                    </label>
                  ))
                )}
              </div>
              <button
                type="button"
                className="panelButton"
                onClick={() => {
                  const members = searchResults.filter((person) => selectedIds.includes(person.id)).map((person) => person.id);
                  if (!groupName.trim() || members.length < 2) return;
                  onCreateGroupChat(groupName.trim(), members);
                  setGroupName("");
                  setSelectedIds([]);
                  setGroupMode(false);
                }}
              >
                Create group
              </button>
            </div>
          ) : activeThread ? (
            <div className="chatMessageCard">
              <h4>{activeThread.name}</h4>
              <p>{activeThread.memberIds.length} members</p>
              <div className="chatMessages">
                {activeThread.messages.length === 0 ? (
                  <div className="emptyMini">no messages yet</div>
                ) : (
                  activeThread.messages.map((message) => (
                    <div key={message.id} className="messageBubble">
                      {message.text}
                    </div>
                  ))
                )}
              </div>
              <div className="chatComposer">
                <input value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} placeholder="Type a message" />
                <button
                  type="button"
                  className="panelButton"
                  onClick={async () => {
                    if (!messageDraft.trim()) return;
                    await onSendMessage(activeThread.id, messageDraft.trim());
                    setMessageDraft("");
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          ) : noPeople ? (
            <div className="emptyState">
              <strong>no friends yet</strong>
              <span>Search AISC email ids to start a chat or make a group.</span>
            </div>
          ) : (
            <div className="emptyState">
              <strong>Pick a chat to begin.</strong>
              <span>Search AISC email ids or create a group from the icons above.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlannerStudyLab() {
  const [subject, setSubject] = useState("Biology");
  const [resourceText, setResourceText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [activePrompt, setActivePrompt] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const buildQuestions = () => {
    const sentences = resourceText
      .split(/[\n.?!]/g)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
    const prompts = sentences.slice(0, 6).map((sentence, index) => ({
      id: `${index}-${sentence.slice(0, 18)}`,
      question: `Explain this ${subject.toLowerCase()} idea: ${sentence.slice(0, 90)}${sentence.length > 90 ? "..." : ""}`,
      answer: sentence,
    }));

    setQuestions(
      prompts.length
        ? prompts
        : [
            {
              id: "default-study",
              question: `Write one key fact from your ${subject.toLowerCase()} resource.`,
              answer: resourceText.trim(),
            },
          ],
    );
    setActivePrompt(0);
    setFeedback("");
    setAnswer("");
  };

  const currentQuestion = questions[activePrompt] || null;

  return (
    <div className="plannerSection">
      <div className="plannerSectionHeader">
        <div>
          <p className="plannerEyebrow">Study platform</p>
          <h3>Resource-driven practice</h3>
        </div>
        <button type="button" className="panelButton" onClick={buildQuestions}>
          Make questions
        </button>
      </div>

      <div className="plannerTwoColumn">
        <label className="plannerField">
          <span>Subject / topic</span>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Biology, Spanish, History..." />
        </label>
        <label className="plannerField">
          <span>Paste study resources</span>
          <textarea value={resourceText} onChange={(event) => setResourceText(event.target.value)} placeholder="Paste notes, reading, or key points here." />
        </label>
      </div>

      <div className="plannerStudyCard">
        <div className="plannerStudyQuestion">
          <span>Question</span>
          <strong>{currentQuestion ? currentQuestion.question : "Generate questions from your resources."}</strong>
        </div>
        <div className="plannerStudyAnswer">
          <input value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer" />
          <button
            type="button"
            className="panelButton"
            onClick={() => {
              if (!currentQuestion) return;
              const normalized = answer.trim().toLowerCase();
              const reference = String(currentQuestion.answer || "").trim().toLowerCase();
              setFeedback(reference && normalized && reference.includes(normalized) ? "Looks right. Keep going." : "Keep studying and try again.");
            }}
          >
            Check answer
          </button>
        </div>
        <div className="plannerInlineFeedback">{feedback || "You can build a quick study deck from anything you paste here."}</div>
        <div className="plannerQuestionList">
          {questions.length === 0 ? (
            <div className="emptyMini">No generated questions yet</div>
          ) : (
            questions.map((item, index) => (
              <button key={item.id} type="button" className={`plannerQuestionChip ${index === activePrompt ? "isActive" : ""}`} onClick={() => setActivePrompt(index)}>
                Q{index + 1}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function PlannerTodoBoard() {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);

  const addItem = () => {
    const value = input.trim();
    if (!value) return;
    setItems((current) => [...current, { id: crypto.randomUUID(), text: value, status: "todo" }]);
    setInput("");
  };

  const moveItem = (id, status) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const columns = [
    { id: "todo", label: "To do" },
    { id: "progress", label: "In progress" },
    { id: "done", label: "Done" },
  ];

  return (
    <div className="plannerSection">
      <div className="plannerSectionHeader">
        <div>
          <p className="plannerEyebrow">Task tracker</p>
          <h3>Three-way workflow board</h3>
        </div>
        <button type="button" className="panelButton" onClick={addItem}>
          Add task
        </button>
      </div>

      <div className="plannerAddRow">
        <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type a deadline, chore, or goal" />
      </div>

      <div className="plannerBoard">
        {columns.map((column) => (
          <section key={column.id} className="plannerColumn">
            <h4>{column.label}</h4>
            <div className="plannerStack">
              {items.filter((item) => item.status === column.id).length === 0 ? (
                <div className="emptyMini">No items</div>
              ) : (
                items
                  .filter((item) => item.status === column.id)
                  .map((item) => (
                    <article key={item.id} className="plannerTaskCard">
                      <strong>{item.text}</strong>
                      <div className="plannerTaskActions">
                        {column.id !== "todo" ? (
                          <button type="button" className="plannerMiniAction" onClick={() => moveItem(item.id, "todo")}>
                            To do
                          </button>
                        ) : null}
                        {column.id !== "progress" ? (
                          <button type="button" className="plannerMiniAction" onClick={() => moveItem(item.id, "progress")}>
                            In progress
                          </button>
                        ) : null}
                        {column.id !== "done" ? (
                          <button type="button" className="plannerMiniAction" onClick={() => moveItem(item.id, "done")}>
                            Done
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function PlannerTimer() {
  const [minutes, setMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("Focus");

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setMode((currentMode) => (currentMode === "Focus" ? "Break" : "Focus"));
          return minutes * 60;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [minutes, running]);

  const setPreset = (nextMinutes) => {
    setMinutes(nextMinutes);
    setSecondsLeft(nextMinutes * 60);
    setRunning(false);
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="plannerSection">
      <div className="plannerSectionHeader">
        <div>
          <p className="plannerEyebrow">Pomodoro</p>
          <h3>Study timer</h3>
        </div>
        <div className="plannerTimerPresets">
          <button type="button" className="plannerMiniAction" onClick={() => setPreset(25)}>
            25 min
          </button>
          <button type="button" className="plannerMiniAction" onClick={() => setPreset(45)}>
            45 min
          </button>
          <button type="button" className="plannerMiniAction" onClick={() => setPreset(50)}>
            50 min
          </button>
        </div>
      </div>

      <div className="plannerTimerDial">
        <strong>{mode}</strong>
        <span>
          {mins}:{secs}
        </span>
      </div>
      <div className="plannerTimerControls">
        <button type="button" className="panelButton" onClick={() => setRunning((current) => !current)}>
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" className="authSwitch" onClick={() => { setRunning(false); setSecondsLeft(minutes * 60); }}>
          Reset
        </button>
      </div>
    </div>
  );
}

function PlannerNotes() {
  const [folders, setFolders] = useState([
    { id: "class", title: "Class notes", notes: [] },
  ]);
  const [folderTitle, setFolderTitle] = useState("");
  const [activeFolderId, setActiveFolderId] = useState("class");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");

  const addFolder = () => {
    const title = folderTitle.trim();
    if (!title) return;
    const id = crypto.randomUUID();
    setFolders((current) => [...current, { id, title, notes: [] }]);
    setFolderTitle("");
    setActiveFolderId(id);
  };

  const addNote = () => {
    if (!noteTitle.trim() && !noteBody.trim()) return;
    setFolders((current) =>
      current.map((folder) =>
        folder.id === activeFolderId
          ? {
              ...folder,
              notes: [...folder.notes, { id: crypto.randomUUID(), title: noteTitle.trim() || "Untitled note", body: noteBody.trim() }],
            }
          : folder,
      ),
    );
    setNoteTitle("");
    setNoteBody("");
  };

  const activeFolder = folders.find((folder) => folder.id === activeFolderId) || folders[0];

  return (
    <div className="plannerSection">
      <div className="plannerSectionHeader">
        <div>
          <p className="plannerEyebrow">Notes</p>
          <h3>Folder-based notebook</h3>
        </div>
        <button type="button" className="panelButton" onClick={addFolder}>
          Add folder
        </button>
      </div>

      <div className="plannerTwoColumn">
        <div className="plannerFolderRail">
          <input value={folderTitle} onChange={(event) => setFolderTitle(event.target.value)} placeholder="New folder name" />
          <div className="plannerFolderList">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className={`plannerFolderChip ${folder.id === activeFolderId ? "isActive" : ""}`}
                onClick={() => setActiveFolderId(folder.id)}
              >
                {folder.title}
              </button>
            ))}
          </div>
        </div>

        <div className="plannerNotesCard">
          <input value={noteTitle} onChange={(event) => setNoteTitle(event.target.value)} placeholder="Note title" />
          <textarea value={noteBody} onChange={(event) => setNoteBody(event.target.value)} placeholder="Type freely or sketch out a class idea." />
          <button type="button" className="panelButton" onClick={addNote}>
            Save note
          </button>

          <div className="plannerSavedNotes">
            {(activeFolder?.notes || []).length === 0 ? (
              <div className="emptyMini">No notes in this folder yet.</div>
            ) : (
              activeFolder.notes.map((note) => (
                <article key={note.id} className="plannerNoteCard">
                  <strong>{note.title}</strong>
                  <p>{note.body}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlannerAssignments() {
  const [sheets, setSheets] = useState([
    {
      id: "main",
      title: "Assignments",
      rows: [],
    },
  ]);
  const [activeSheetId, setActiveSheetId] = useState("main");
  const [sheetName, setSheetName] = useState("");
  const [rowDraft, setRowDraft] = useState({ subject: "", assignment: "", dueDate: "", notes: "", teacher: "" });

  const activeSheet = sheets.find((sheet) => sheet.id === activeSheetId) || sheets[0];

  const addSheet = () => {
    const title = sheetName.trim();
    if (!title) return;
    const id = crypto.randomUUID();
    setSheets((current) => [...current, { id, title, rows: [] }]);
    setActiveSheetId(id);
    setSheetName("");
  };

  const removeSheet = (sheetId) => {
    setSheets((current) => current.filter((sheet) => sheet.id !== sheetId));
    setActiveSheetId((current) => {
      if (current !== sheetId) return current;
      return sheets.find((sheet) => sheet.id !== sheetId)?.id || "main";
    });
  };

  const addRow = () => {
    const hasAny = Object.values(rowDraft).some((value) => String(value || "").trim());
    if (!hasAny) return;
    setSheets((current) =>
      current.map((sheet) =>
        sheet.id === activeSheetId
          ? {
              ...sheet,
              rows: [...sheet.rows, { id: crypto.randomUUID(), ...rowDraft }],
            }
          : sheet,
      ),
    );
    setRowDraft({ subject: "", assignment: "", dueDate: "", notes: "", teacher: "" });
  };

  return (
    <div className="plannerSection">
      <div className="plannerSectionHeader">
        <div>
          <p className="plannerEyebrow">Tracker</p>
          <h3>Assignment sheets</h3>
        </div>
        <div className="plannerSheetBar">
          {sheets.map((sheet) => (
            <button key={sheet.id} type="button" className={`plannerSheetChip ${sheet.id === activeSheetId ? "isActive" : ""}`} onClick={() => setActiveSheetId(sheet.id)}>
              {sheet.title}
              {sheet.id !== "main" ? (
                <span
                  role="button"
                  tabIndex={0}
                  aria-label={`Delete ${sheet.title}`}
                  className="plannerSheetClose"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeSheet(sheet.id);
                  }}
                >
                  ×
                </span>
              ) : null}
            </button>
          ))}
          <input value={sheetName} onChange={(event) => setSheetName(event.target.value)} placeholder="New tab name" className="plannerSheetInput" />
          <button type="button" className="plannerMiniAction" onClick={addSheet}>
            +
          </button>
        </div>
      </div>

      <div className="plannerAssignmentsCard">
        <div className="plannerAssignmentForm">
          {["subject", "assignment", "dueDate", "notes", "teacher"].map((field) => (
            <input
              key={field}
              value={rowDraft[field]}
              onChange={(event) => setRowDraft((current) => ({ ...current, [field]: event.target.value }))}
              placeholder={field === "dueDate" ? "Due date" : field === "teacher" ? "Teacher in charge" : field.charAt(0).toUpperCase() + field.slice(1)}
            />
          ))}
          <button type="button" className="panelButton" onClick={addRow}>
            Add assignment
          </button>
        </div>

        <div className="plannerTableWrap">
          <table className="plannerTable">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Assignment</th>
                <th>Due date</th>
                <th>Notes</th>
                <th>Teacher in charge</th>
              </tr>
            </thead>
            <tbody>
              {(activeSheet?.rows || []).length === 0 ? (
                <tr>
                  <td colSpan="5" className="plannerTableEmpty">
                    No assignments in this sheet yet.
                  </td>
                </tr>
              ) : (
                activeSheet.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.subject}</td>
                    <td>{row.assignment}</td>
                    <td>{row.dueDate}</td>
                    <td>{row.notes}</td>
                    <td>{row.teacher}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PlannerWorkspace({ theme = "dark" }) {
  return (
    <div className="plannerWorkspace">
      <div className="plannerWorkspaceIntro">
        <p className="plannerEyebrow">AISC Planner</p>
        <h3>Choose a planner app</h3>
        <p>Every card opens a separate local app so the planner tools stay independent from the arcade.</p>
      </div>
      <div className="plannerLauncherGrid">
        {PLANNER_APPS.map((app) => (
          <LaunchCard key={app.id} item={app} ctaLabel="Open →" theme={theme} onLaunch={() => window.location.assign(app.url)} />
        ))}
      </div>
    </div>
  );
}

function AppShell({
  user,
  stats,
  chats,
  privateApps,
  decks,
  games,
  activeView,
  setActiveView,
  onLogout,
  onUpdateProfile,
  onGameClick,
  onRequestInvite,
  onCreateDirectChat,
  onCreateGroupChat,
  onSendMessage,
  onSearchUsers,
  onRateGame,
  selectedDeckId,
  onSelectDeck,
  onUploadDeck,
  isOwner,
  onCreateGameDraft,
  workspace,
  setWorkspace,
}) {
  const [ratingDraft, setRatingDraft] = useState({ game: "", stars: {} });
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(chats.threads[0]?.id || "");

  useEffect(() => {
    setSelectedApp((current) => {
      if (!current) return current;
      return privateApps.all.find((app) => app.id === current.id) || null;
    });
  }, [privateApps.all]);

  useEffect(() => {
    setActiveThreadId(chats.threads[0]?.id || "");
  }, [chats.threads]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        if (!searchQuery.trim()) {
          setSearchResults([]);
          return;
        }
        const result = await onSearchUsers(searchQuery);
        if (!cancelled) setSearchResults(result.users || []);
      } catch {
        if (!cancelled) setSearchResults([]);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onSearchUsers, searchQuery]);

  const activeThread = chats.threads.find((thread) => thread.id === activeThreadId) || chats.threads[0] || null;
  const visibleDockView = activeView === "private-app-detail" ? "private-apps" : activeView === "hub" ? "hub" : activeView;
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) || null;

  let content;
  if (activeView === "profile") {
    content = <ProfilePage user={user} onLogout={onLogout} onUpdateProfile={onUpdateProfile} />;
  } else if (activeView === "stats") {
    content = <StatsPage stats={stats} games={games} onRateGame={onRateGame} ratingDraft={ratingDraft} setRatingDraft={setRatingDraft} currentUserId={user.id} />;
  } else if (activeView === "private-apps") {
    content = (
      <PrivateAppsPage
        invites={privateApps.invites}
        memberships={privateApps.memberships}
        allApps={privateApps.all}
        onOpenApp={(app) => {
          setSelectedApp(app);
          setActiveView("private-app-detail");
        }}
      />
    );
  } else if (activeView === "private-app-detail") {
    content = (
      <PrivateAppDetailPage
        app={selectedApp || privateApps.all[0] || null}
        requestedIds={privateApps.requestedIds || []}
        onBack={() => setActiveView("private-apps")}
        onRequestInvite={onRequestInvite}
      />
    );
  } else if (activeView === "chats") {
    content = (
      <ChatsPage
        threads={chats.threads}
        searchQuery={searchQuery}
        searchResults={searchResults}
        onSearch={setSearchQuery}
        onCreateDirectChat={async (recipientId) => {
          const thread = await onCreateDirectChat(recipientId);
          if (thread?.id) setActiveThreadId(thread.id);
          setActiveView("chats");
        }}
        onCreateGroupChat={async (groupName, memberIds) => {
          const thread = await onCreateGroupChat(groupName, memberIds);
          if (thread?.id) setActiveThreadId(thread.id);
          setActiveView("chats");
        }}
        onSelectThread={setActiveThreadId}
        activeThread={activeThread}
        onSendMessage={onSendMessage}
      />
    );
  } else {
    content =
      workspace === "planner" ? (
        <PlannerWorkspace theme={theme} />
      ) : (
        <>
          {selectedDeck ? (
            <div className="selectedDeckBanner">
              <span>Selected deck</span>
              <strong>{selectedDeck.title}</strong>
              <small>{selectedDeck.fileName || "Uploaded PDF"}</small>
            </div>
          ) : null}
          <div className="gameGrid">
            {games.map((game) => (
              <button key={game.id} className="gameButton" type="button" onClick={() => onGameClick(game)}>
                <div className="cardShadow">
                  <div className="gameCard" style={{ backgroundColor: game.color }}>
                    <GameIcon type={game.icon} />
                  </div>
                </div>
                <div className="gameTitle">{game.title}</div>
                <div className="gameSubtitle">{game.subtitle}</div>
              </button>
            ))}
          </div>
        </>
      );
  }

  return (
    <main className="page">
      {isOwner ? (
        <div className="ownerQuickCreate">
          <button type="button" className="ownerQuickButton" onClick={() => onCreateGameDraft("public")}>
            <span>+</span>
            <small>public</small>
          </button>
          <button type="button" className="ownerQuickButton" onClick={() => onCreateGameDraft("private")}>
            <span>+</span>
            <small>private</small>
          </button>
        </div>
      ) : null}
      <div className="workspaceTabs">
        {WORKSPACE_TABS.map((tab) => (
          <button key={tab.id} type="button" className={`workspaceTab ${workspace === tab.id ? "isActive" : ""}`} onClick={() => setWorkspace(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="hubLayout">
        <HubSidebar
          activeView={visibleDockView}
          setActiveView={setActiveView}
          decks={decks}
          selectedDeckId={selectedDeckId}
          onSelectDeck={onSelectDeck}
          onUploadDeck={onUploadDeck}
          isOwner={isOwner}
          onCreateGameDraft={onCreateGameDraft}
        />

        <section className="hero hubMain">
          <div className="forgeBrand">
            <p className="forgeTagline">
              AISC Forge is a student-built software initiative that forges school ideas into usable digital tools, creating multiplayer learning games, club dashboards, study apps, event systems, and teacher-requested utilities for the AISC community.
            </p>
            <div className="badge">THE FORGE</div>
            <h1>THE FORGE</h1>
            <h2>Pick a game and jump in.</h2>
          </div>

          {content}
        </section>
      </div>
    </main>
  );
}

function AuthGate({ onGoogleSignIn }) {
  return <LoginCard onGoogleSignIn={onGoogleSignIn} />;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hubGames] = useState(ARCADE_APPS);
  const [dashboard, setDashboard] = useState({
    stats: {},
    decks: [],
    chats: { threads: [] },
    privateApps: { invites: [], memberships: [], all: [EMPTY_PRIVATE_APP], requestedIds: [] },
  });
  const [activeView, setActiveView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const workspaceFromUrl = params.get("workspace");
    if (workspaceFromUrl === "planner" || workspaceFromUrl === "arcade") return workspaceFromUrl;
    return window.localStorage.getItem("forge.activeView") || "arcade";
  });
  const [selectedDeckId, setSelectedDeckId] = useState(() => window.localStorage.getItem("forge.selectedDeckId") || "");
  const pathname = window.location.pathname;

  const refreshState = async () => {
    const payload = await apiRequest("/api/bootstrap");
    setUser(payload.user || null);
    setDashboard({
      stats: payload.stats || {},
      decks: payload.decks || [],
      chats: payload.chats || { threads: [] },
      privateApps: payload.privateApps || { invites: [], memberships: [], all: [EMPTY_PRIVATE_APP], requestedIds: [] },
    });
    return payload;
  };

  useEffect(() => {
    refreshState().catch(() => null).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (pathname === "/admin") {
      setActiveView("arcade");
    }
  }, [pathname]);

  useEffect(() => {
    window.localStorage.setItem("forge.activeView", activeView);
    const nextUrl = new URL(window.location.href);
    if (activeView === "arcade" || activeView === "planner") {
      nextUrl.searchParams.set("workspace", activeView);
    } else {
      nextUrl.searchParams.delete("workspace");
    }
    window.history.replaceState({}, "", nextUrl);
  }, [activeView]);

  useEffect(() => {
    window.localStorage.setItem("forge.selectedDeckId", selectedDeckId);
  }, [selectedDeckId]);

  const googleSignIn = async (role, credential, setError) => {
    try {
      const payload = await apiRequest("/api/auth/google", { method: "POST", body: { role, credential } });
      setUser(payload.user);
      setDashboard({
        stats: payload.stats || {},
        decks: payload.decks || [],
        chats: payload.chats || { threads: [] },
        privateApps: payload.privateApps || { invites: [], memberships: [], all: [EMPTY_PRIVATE_APP], requestedIds: [] },
      });
      setActiveView("arcade");
    } catch (error) {
      setError(error.message || "Unable to sign in with Google.");
    }
  };

  const logout = async () => {
    await apiRequest("/api/logout", { method: "POST" });
    setUser(null);
    setDashboard({
      stats: {},
      decks: [],
      chats: { threads: [] },
      privateApps: { invites: [], memberships: [], all: [EMPTY_PRIVATE_APP], requestedIds: [] },
    });
    setActiveView("arcade");
  };

  const updateProfile = async ({ username, avatar }) => {
    const payload = await apiRequest("/api/profile", { method: "PATCH", body: { username, avatar } });
    setUser(payload.user);
    setDashboard((current) => ({
      ...current,
      stats: payload.stats || current.stats,
      decks: payload.decks || current.decks,
      chats: payload.chats || current.chats,
      privateApps: payload.privateApps || current.privateApps,
    }));
  };

  const uploadDeck = async ({ title, file }) => {
    const dataUrl = await readFileAsDataUrl(file);
    await apiRequest("/api/decks", {
      method: "POST",
      body: {
        title,
        fileName: file.name,
        dataUrl,
      },
    });
    setSelectedDeckId((current) => current || "");
    await refreshState().catch(() => null);
  };

  const recordGame = async (game) => {
    const target = new URL(resolveHubLaunch(game));
    const selectedDeck = dashboard.decks?.find((deck) => deck.id === selectedDeckId);
    if (selectedDeck) {
      target.searchParams.set("deckId", selectedDeck.id);
      target.searchParams.set("deckTitle", selectedDeck.title);
    }
    void apiRequest("/api/game-play", { method: "POST", body: { title: game.title } }).catch(() => null);
    window.location.assign(target.toString());
  };

  const recordInternalGame = async (title) => {
    await apiRequest("/api/game-play", { method: "POST", body: { title } }).catch(() => null);
    await refreshState().catch(() => null);
  };

  const requestInvite = async (appId) => {
    await apiRequest("/api/private-apps/request", { method: "POST", body: { appId } });
    await refreshState().catch(() => null);
  };

  const createDirectChat = async (recipientId) => {
    const response = await apiRequest("/api/chats/direct", { method: "POST", body: { recipientId } });
    await refreshState().catch(() => null);
    setActiveView("chats");
    return response.thread;
  };

  const createGroupChat = async (groupName, memberIds) => {
    const response = await apiRequest("/api/chats/group", { method: "POST", body: { groupName, memberIds } });
    await refreshState().catch(() => null);
    setActiveView("chats");
    return response.thread;
  };

  const sendMessage = async (threadId, text) => {
    await apiRequest(`/api/chats/${threadId}/messages`, { method: "POST", body: { text } });
    await refreshState().catch(() => null);
  };

  const searchUsers = async (query) => {
    return apiRequest(`/api/users/search?q=${encodeURIComponent(query)}`);
  };

  const rateGame = async (game, stars) => {
    await apiRequest("/api/ratings", { method: "POST", body: { game, stars } });
    await refreshState().catch(() => null);
  };

  if (loading) {
    return (
      <div className="authShell">
        <div className="authCard">
          <div className="authPill">AISC access only</div>
          <h3>Loading</h3>
          <p>Checking your session.</p>
        </div>
      </div>
    );
  }

  if (pathname === "/admin") {
    return <AdminPage />;
  }

  if (!user) {
    return <AuthGate onGoogleSignIn={googleSignIn} />;
  }

  return (
    <ForgeShell
      user={user}
      stats={dashboard.stats || {}}
      decks={dashboard.decks || []}
      chats={dashboard.chats || { threads: [] }}
      privateApps={dashboard.privateApps || { invites: [], memberships: [], all: [EMPTY_PRIVATE_APP], requestedIds: [] }}
      games={hubGames}
      activeView={activeView}
      setActiveView={setActiveView}
      onLogout={logout}
      onUpdateProfile={updateProfile}
      onGameClick={recordGame}
      onRequestInvite={requestInvite}
      onCreateDirectChat={createDirectChat}
      onCreateGroupChat={createGroupChat}
      onSendMessage={sendMessage}
      onSearchUsers={searchUsers}
      onRateGame={rateGame}
      selectedDeckId={selectedDeckId}
      onSelectDeck={setSelectedDeckId}
      onUploadDeck={uploadDeck}
      isOwner={user?.role === "owner" || user?.email === "caditi28@aischennai.org"}
      onRecordGamePlay={recordInternalGame}
      onCreateGameDraft={(kind) => {
        window.alert(`make a new ${kind} game\nGo to codex to do so.`);
      }}
    />
  );
}
