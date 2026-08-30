import { useEffect, useMemo, useState } from "react";
import { platformRequest } from "./platformApi";

const TABS = ["Stats", "Feedback", "Planning", "Members", "Permissions"];
const formatRating = (value) => (value === null || value === undefined ? "No ratings yet" : `${value.toFixed(1)} / 5`);

function AdminStats({ stats }) {
  return <section className="adminTabPanel" aria-label="Admin statistics">
    <div className="adminSummaryGrid">
      <article><span>Most played</span><strong>{stats.mostPlayed?.title || "No plays yet"}</strong><small>{stats.mostPlayed ? `${stats.mostPlayed.count} plays` : ""}</small></article>
      <article><span>Least played</span><strong>{stats.leastPlayed?.title || "No apps yet"}</strong><small>{stats.leastPlayed ? `${stats.leastPlayed.count} plays` : ""}</small></article>
      <article><span>Average rating</span><strong>{formatRating(stats.averageRating)}</strong><small>Across all app ratings</small></article>
    </div>
    <div className="adminSurfaceCard"><h2>Ratings by app</h2><div className="adminRatingsList">
      {stats.ratings.map((app) => <div key={app.id}><span>{app.title}</span><strong>{formatRating(app.average)}</strong><small>{app.count} rating{app.count === 1 ? "" : "s"}</small></div>)}
    </div></div>
  </section>;
}

function AdminFeedback({ feedback }) {
  return <section className="adminTabPanel" aria-label="Feedback inbox"><div className="adminSurfaceCard"><h2>Feedback inbox</h2><p>Messages submitted from the Requests page.</p>
    {feedback.length === 0 ? <p className="adminEmptyState">No feedback has been submitted yet.</p> : <div className="adminFeedbackList">
      {feedback.map((entry) => <article key={entry.id} className="adminFeedbackMessage"><header><strong>{entry.submittedBy.name || entry.submittedBy.email}</strong><span>{entry.submittedBy.email}</span><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time></header><p>{entry.message}</p></article>)}
    </div>}
  </div></section>;
}

function AdminPlanning({ planning, onSaveNote, onAddTodo, onToggleTodo }) {
  const [mode, setMode] = useState("note");
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event) => {
    event.preventDefault(); setMessage("");
    try { if (mode === "note") await onSaveNote(draft); else await onAddTodo(draft); setDraft(""); }
    catch (error) { setMessage(error.message || "Unable to save planning item."); }
  };
  return <section className="adminTabPanel" aria-label="Planning">
    <div className="adminSurfaceCard"><h2>Planning</h2><p>Keep private owner notes or a simple to-do list.</p>
      <div className="adminPlanningMode" role="tablist" aria-label="Planning type">
        <button type="button" role="tab" aria-selected={mode === "note"} className={mode === "note" ? "active" : ""} onClick={() => setMode("note")}>Note card</button>
        <button type="button" role="tab" aria-selected={mode === "todo"} className={mode === "todo" ? "active" : ""} onClick={() => setMode("todo")}>To-do list</button>
      </div>
      <form className="adminPlanningForm" onSubmit={submit}><label htmlFor="admin-planning-draft">{mode === "note" ? "New note" : "New to-do"}</label><textarea id="admin-planning-draft" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={mode === "note" ? "Write a planning note" : "Add a to-do"} required maxLength={2000} /><button type="submit" className="panelButton" disabled={!draft.trim()}>{mode === "note" ? "Save note" : "Add to-do"}</button>{message ? <p className="feedbackError" role="alert">{message}</p> : null}</form>
    </div>
    <div className="adminPlanningColumns">
      <div className="adminSurfaceCard"><h2>Note cards</h2>{planning.notes.length === 0 ? <p className="adminEmptyState">No notes yet.</p> : planning.notes.map((note) => <article key={note.id} className="adminNoteCard"><p>{note.text}</p><time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleString()}</time></article>)}</div>
      <div className="adminSurfaceCard"><h2>To-do list</h2>{planning.todos.length === 0 ? <p className="adminEmptyState">No to-dos yet.</p> : planning.todos.map((todo) => <label key={todo.id} className="adminTodo"><input type="checkbox" checked={todo.completed} onChange={() => onToggleTodo(todo.id, !todo.completed)} /><span>{todo.text}</span></label>)}</div>
    </div>
  </section>;
}

function MemberGroup({ title, members }) {
  return <div className="adminMemberGroup"><h2>{title}</h2>{members.length === 0 ? <p className="adminEmptyState">None yet.</p> : members.map((member) => <article key={member.id} className="adminMemberCard"><strong>{member.name || member.email}</strong><span>{member.email}</span><p>{[...member.hostedApps, ...member.communitySpaces].length ? `In charge of: ${[...member.hostedApps, ...member.communitySpaces].join(", ")}` : "Not in charge of a game, class, or club."}</p></article>)}</div>;
}

function AdminMembers({ members }) {
  const groups = useMemo(() => ({ Administrators: members.filter((member) => member.role === "admin"), Teachers: members.filter((member) => member.role === "teacher"), Students: members.filter((member) => member.role !== "admin" && member.role !== "teacher") }), [members]);
  return <section className="adminTabPanel adminMembersPanel" aria-label="Members"><MemberGroup title="Administrators" members={groups.Administrators} /><MemberGroup title="Teachers" members={groups.Teachers} /><MemberGroup title="Students" members={groups.Students} /></section>;
}

function AdminPermissions({ permissions }) {
  return <section className="adminTabPanel" aria-label="Club and class permissions"><div className="adminSurfaceCard"><h2>Classes and clubs</h2><p>This is a read-only ownership view. Assignment editing is intentionally out of scope for this PR.</p><div className="adminPermissionsList">{permissions.map((space) => <article key={space.id}><span>{space.type}</span><strong>{space.title}</strong><p>{space.ownerName || "Unassigned"}{space.ownerEmail ? ` · ${space.ownerEmail}` : ""}</p></article>)}</div></div></section>;
}

export default function AdminPage({ onExit }) {
  const [tab, setTab] = useState("Stats");
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const load = async (retry = true) => {
    try {
      const payload = await platformRequest("/api/admin/dashboard");
      if (!payload?.stats || !Array.isArray(payload.feedback) || !payload.planning || !Array.isArray(payload.members) || !Array.isArray(payload.permissions)) {
        throw new Error("The local preview server needs a restart before the owner dashboard can load.");
      }
      setDashboard(payload);
    } catch (loadError) {
      // A hard refresh of the local preview can briefly race its explicit
      // preview-session bootstrap. Retry once; normal unauthorized users still
      // receive the server's 403 response and never receive dashboard data.
      if (retry && loadError.status === 403) {
        await new Promise((resolve) => window.setTimeout(resolve, 150));
        return load(false);
      }
      throw loadError;
    }
  };
  useEffect(() => { load().catch((loadError) => setError(loadError.message || "Unable to load admin dashboard.")); }, []);
  const updatePlanning = async (path, body, method = "POST") => { const payload = await platformRequest(path, { method, body }); setDashboard((current) => ({ ...current, planning: payload.planning })); };
  if (error) return <main className="adminPage"><div className="adminAccessCard" role="alert">{error}</div></main>;
  if (!dashboard) return <main className="adminPage"><div className="adminAccessCard">Loading your owner dashboard…</div></main>;
  const panel = tab === "Stats" ? <AdminStats stats={dashboard.stats} /> : tab === "Feedback" ? <AdminFeedback feedback={dashboard.feedback} /> : tab === "Planning" ? <AdminPlanning planning={dashboard.planning} onSaveNote={(text) => updatePlanning("/api/admin/planning/notes", { text })} onAddTodo={(text) => updatePlanning("/api/admin/planning/todos", { text })} onToggleTodo={(id, completed) => updatePlanning(`/api/admin/planning/todos/${id}`, { completed }, "PATCH")} /> : tab === "Members" ? <AdminMembers members={dashboard.members} /> : <AdminPermissions permissions={dashboard.permissions} />;
  return <main className="adminPage"><header className="adminHeader"><div><p>THE FORGE</p><h1>Owner dashboard</h1></div><button type="button" className="panelButton ghost" onClick={onExit}>Exit admin</button></header><div className="adminDashboard"><nav className="adminSidebar" aria-label="Owner dashboard"><strong>ADMIN</strong>{TABS.map((item) => <button key={item} type="button" className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav><section className="adminContent"><h2>{tab}</h2>{panel}</section></div></main>;
}
