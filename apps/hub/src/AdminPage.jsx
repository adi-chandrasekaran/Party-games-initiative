import { useEffect, useMemo, useState } from "react";
import { platformRequest } from "./platformApi";

const ADMIN_CODE_KEY = "party_games_admin_code";
const ROLE_OPTIONS = ["teacher", "student", "host", "other"];

function toggleListValue(list, value) {
  return list.includes(value) ? list.filter((entry) => entry !== value) : [...list, value];
}

function GameStatusBadge({ game }) {
  return <span className={`adminBadge ${game.status === "active" ? "good" : "warn"}`}>{game.isPublic ? "Public" : "Private"} · {game.status}</span>;
}

export default function AdminPage() {
  const [code, setCode] = useState(localStorage.getItem(ADMIN_CODE_KEY) || "");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [draft, setDraft] = useState({
    name: "",
    emailOrUsername: "",
    role: "teacher",
    hostGameIds: [],
  });

  const selectedUser = useMemo(() => users.find((user) => user.id === selectedUserId) || null, [selectedUserId, users]);

  const loadAdminData = async (adminCode = code) => {
    const [gamesPayload, usersPayload] = await Promise.all([
      platformRequest("/api/platform/admin/games", { code: adminCode }),
      platformRequest("/api/platform/admin/users", { code: adminCode }),
    ]);
    setGames(gamesPayload.games || []);
    setUsers(usersPayload.users || []);
  };

  const verify = async () => {
    setLoading(true);
    setMessage("");
    try {
      const payload = await platformRequest("/api/platform/admin/verify", { method: "POST", body: { code } });
      if (!payload.ok) {
        setVerified(false);
        setMessage("Invalid owner admin code.");
        return;
      }
      localStorage.setItem(ADMIN_CODE_KEY, code);
      setVerified(true);
      await loadAdminData(code);
      setMessage("Admin access granted.");
    } catch (error) {
      setMessage(error.message || "Unable to verify admin code.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!code) return;
    verify().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUser) {
      setDraft({
        name: "",
        emailOrUsername: "",
        role: "teacher",
        hostGameIds: [],
      });
      return;
    }

    setDraft({
      name: selectedUser.name || "",
      emailOrUsername: selectedUser.emailOrUsername || "",
      role: selectedUser.role || "other",
      hostGameIds: selectedUser.hostGameIds || [],
    });
  }, [selectedUser]);

  const saveGame = async (gameId, patch) => {
    await platformRequest(`/api/platform/admin/games/${gameId}`, {
      method: "PATCH",
      code,
      body: patch,
    });
    await loadAdminData();
    setMessage("Game settings saved.");
  };

  const saveHosts = async (gameId, hostUserIds) => {
    await platformRequest(`/api/platform/admin/games/${gameId}/hosts`, {
      method: "PATCH",
      code,
      body: { hostUserIds },
    });
    await loadAdminData();
    setMessage("Host assignments updated.");
  };

  const saveUser = async () => {
    const body = {
      name: draft.name,
      emailOrUsername: draft.emailOrUsername,
      role: draft.role,
      hostGameIds: draft.hostGameIds,
    };

    const path = selectedUser ? `/api/platform/admin/users/${selectedUser.id}` : "/api/platform/admin/users";
    const method = selectedUser ? "PATCH" : "POST";
    await platformRequest(path, { method, code, body });
    await loadAdminData();
    setSelectedUserId("");
    setMessage(selectedUser ? "User updated." : "User added.");
  };

  const deleteUser = async (userId) => {
    await platformRequest(`/api/platform/admin/users/${userId}`, { method: "DELETE", code, body: { code } });
    if (selectedUserId === userId) setSelectedUserId("");
    await loadAdminData();
    setMessage("User removed.");
  };

  const hostLookup = Object.fromEntries(users.map((user) => [user.id, user.name || user.emailOrUsername || user.id]));

  if (!verified) {
    return (
      <main className="adminPage">
        <section className="adminShell">
          <div className="authPill">Owner admin</div>
          <h1>AISC Forge Admin</h1>
          <p className="adminLead">Enter the owner code to manage public/private status, visibility, and host assignments.</p>
          <div className="adminLoginCard">
            <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Owner admin code" type="password" />
            {message ? <div className="adminMessage">{message}</div> : null}
            <button type="button" className="authSubmit" onClick={verify} disabled={loading}>
              {loading ? "Checking..." : "Unlock admin"}
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="adminPage">
      <section className="hero adminHero">
        <div className="badge">THE FORGE</div>
        <h1>ADMIN</h1>
        <h2>Manage games and hosts without changing the launcher flow.</h2>

        <div className="panelCard adminPanel">
          <div className="profileTopRow">
            <div>
              <h3>Game Settings</h3>
              <p>Public/private and active/hidden controls stay here only.</p>
            </div>
            <button
              type="button"
              className="panelButton ghost"
              onClick={() => {
                localStorage.removeItem(ADMIN_CODE_KEY);
                setVerified(false);
                setMessage("Signed out of admin.");
              }}
            >
              Exit admin
            </button>
          </div>

          <div className="adminGameGrid">
            {games.map((game) => (
              <div key={game.id} className="adminGameCard">
                <div className="adminGameHeader">
                  <div>
                    <strong>{game.title}</strong>
                    <span>{game.route}</span>
                  </div>
                  <GameStatusBadge game={game} />
                </div>

                <div className="adminToggleRow">
                  <button
                    type="button"
                    className={`miniToggle ${game.isPublic ? "on" : ""}`}
                    onClick={() => saveGame(game.id, { isPublic: !game.isPublic, code })}
                  >
                    {game.isPublic ? "Public" : "Private"}
                  </button>
                  <button
                    type="button"
                    className={`miniToggle ${game.status === "active" ? "on" : ""}`}
                    onClick={() => saveGame(game.id, { status: game.status === "active" ? "hidden" : "active", code })}
                  >
                    {game.status === "active" ? "Active" : "Hidden"}
                  </button>
                </div>

                <div className="adminHosts">
                  <span>Assigned hosts</span>
                  <div className="adminHostList">
                    {(game.hostUserIds || []).length === 0 ? (
                      <div className="emptyMini">No hosts assigned</div>
                    ) : (
                      (game.hostUserIds || []).map((hostId) => <span key={hostId}>{hostLookup[hostId] || hostId}</span>)
                    )}
                  </div>
                </div>

                <div className="adminHostPicker">
                  <span>Set hosts</span>
                  <div className="adminHostCheckboxes">
                    {users.map((user) => (
                      <label key={user.id} className="adminCheckbox">
                        <input
                          type="checkbox"
                          checked={(game.hostUserIds || []).includes(user.id)}
                          onChange={() => {
                            const nextHosts = toggleListValue(game.hostUserIds || [], user.id);
                            saveHosts(game.id, nextHosts).catch((error) => setMessage(error.message || "Unable to update hosts."));
                          }}
                        />
                        <span>{user.name || user.emailOrUsername}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panelCard adminPanel">
          <h3>Host Management</h3>
          <p className="adminLead">Add, edit, or remove any person and choose exactly which games they can host.</p>

          <div className="adminFormGrid">
            <label>
              <span>Name</span>
              <input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
            </label>
            <label>
              <span>Email or username</span>
              <input value={draft.emailOrUsername} onChange={(event) => setDraft((current) => ({ ...current, emailOrUsername: event.target.value }))} placeholder="name@aischennai.org" />
            </label>
            <label>
              <span>Role</span>
              <select value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="adminGameCheckboxes">
            {games.map((game) => (
              <label key={game.id} className="adminCheckbox">
                <input
                  type="checkbox"
                  checked={draft.hostGameIds.includes(game.id)}
                  onChange={() => setDraft((current) => ({ ...current, hostGameIds: toggleListValue(current.hostGameIds, game.id) }))}
                />
                <span>{game.title}</span>
              </label>
            ))}
          </div>

          <div className="editActions">
            <button type="button" className="panelButton" onClick={() => saveUser().catch((error) => setMessage(error.message || "Unable to save user."))}>
              {selectedUser ? "Save changes" : "Add person"}
            </button>
            {selectedUser ? (
              <button type="button" className="panelButton ghost" onClick={() => setSelectedUserId("")}>
                Cancel edit
              </button>
            ) : null}
          </div>

          <div className="adminUserList">
            {users.map((user) => (
              <div key={user.id} className={`adminUserRow ${selectedUserId === user.id ? "isSelected" : ""}`}>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.emailOrUsername}</span>
                  <small>{user.role}</small>
                </div>
                <div className="adminUserActions">
                  {user.role !== "owner" ? (
                    <button type="button" className="panelButton ghost" onClick={() => setSelectedUserId(user.id)}>
                      Edit
                    </button>
                  ) : null}
                  {user.role !== "owner" ? (
                    <button type="button" className="panelButton ghost" onClick={() => deleteUser(user.id).catch((error) => setMessage(error.message || "Unable to remove user."))}>
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {message ? <div className="adminMessage">{message}</div> : null}
        </div>
      </section>
    </main>
  );
}
