import React, { useState, useEffect } from "react";
import T from "../styles/theme";
import { Card, Badge, PageHeader, TabBar, InfoBanner, ViralBar } from "../components/shared";

// Pure helper — determine project game color
const getGameColor = (p, gamesDb) => {
  if (p.gameColor) return p.gameColor;
  const g = gamesDb.find((x) => x.name === p.game);
  return g ? g.color : T.accent;
};

// Pure helper — determine project status
const getProjectStatus = (p) => {
  if (p.status === "processing") return "processing";
  if (p.status === "error") return "error";
  if (p.clips && p.clips.length > 0) {
    const allReviewed = p.clips.filter((c) => c.status === "none").length === 0;
    return allReviewed ? "done" : "ready";
  }
  return "ready";
};

// ============ PROJECT LIST ============
export function ProjectsListView({ vizardProjects = [], onSelect, onPollProject, onImportProject, mainGame, gamesDb = [] }) {
  const [showImport, setShowImport] = useState(false);
  const [importId, setImportId] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    const id = importId.trim();
    if (!id) return;
    if (vizardProjects.some((p) => String(p.id) === id)) {
      setImportError("Project already exists");
      return;
    }
    setImporting(true);
    setImportError("");
    try {
      const result = await window.clipflow.vizardQueryProject(id);
      if (result.error) {
        setImportError(result.error);
        setImporting(false);
        return;
      }
      // Vizard API returns data at top level: { code, videos, projectName, projectId }
      if (result.code !== 2000 || !result.projectId) {
        setImportError(result.msg || "Project not found");
        setImporting(false);
        return;
      }
      // Map and deduplicate clips — videoId is THE unique identifier per Vizard API docs
      // Vizard returns multiple re-edit versions sharing the same clipEditorUrl id; keep latest (highest videoId)
      const mapped = (result.videos || []).map((v) => {
        const editorMatch = (v.clipEditorUrl || "").match(/id=(\d+)/);
        return {
          id: String(v.videoId),
          videoId: v.videoId,
          title: v.title || "Untitled",
          duration: Math.round((v.videoMsDuration || 0) / 1000),
          viralScore: v.viralScore || 0,
          viralReason: v.viralReason || "",
          transcript: v.transcript || "",
          videoUrl: v.videoUrl || "",
          clipEditorUrl: v.clipEditorUrl || "",
          clipEditorId: editorMatch ? editorMatch[1] : null,
          status: "none",
        };
      });
      // Deduplicate by clipEditorId — keep highest videoId (latest version)
      const groups = {};
      for (const c of mapped) {
        const key = c.clipEditorId || c.id;
        if (!groups[key] || c.videoId > (groups[key].videoId || 0)) groups[key] = c;
      }
      const clips = Object.values(groups);
      const project = {
        id: String(result.projectId || id),
        name: result.projectName || `Vizard Project ${id}`,
        status: result.videos && result.videos.length > 0 ? "ready" : "processing",
        progress: result.progress || 0,
        clips,
        createdAt: new Date().toISOString(),
        game: "Unknown",
        gameTag: "?",
        gameColor: T.accent,
        imported: true,
      };
      if (onImportProject) onImportProject(project);
      setImportId("");
      setShowImport(false);
    } catch (e) {
      setImportError(e.message || "Import failed");
    }
    setImporting(false);
  };

  // Poll for processing projects every 30 seconds
  useEffect(() => {
    const processing = vizardProjects.filter((p) => p.status === "processing");
    if (processing.length === 0) return;

    const poll = async () => {
      for (const proj of processing) {
        if (onPollProject) await onPollProject(proj.id);
      }
    };

    poll(); // poll immediately on mount
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [vizardProjects, onPollProject]);

  const importUI = (
    <>
      {showImport ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <input value={importId} onChange={(e) => { setImportId(e.target.value); setImportError(""); }} onKeyDown={(e) => e.key === "Enter" && handleImport()} placeholder="Vizard Project ID" autoFocus style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${importError ? T.redBorder : T.accentBorder}`, background: "rgba(255,255,255,0.04)", color: T.text, fontSize: 12, fontFamily: T.mono, outline: "none", width: 180 }} />
          <button onClick={handleImport} disabled={importing} style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: T.green, color: "#fff", fontSize: 11, fontWeight: 700, cursor: importing ? "default" : "pointer", fontFamily: T.font, opacity: importing ? 0.6 : 1 }}>{importing ? "..." : "Import"}</button>
          <button onClick={() => { setShowImport(false); setImportError(""); setImportId(""); }} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.textTertiary, fontSize: 11, cursor: "pointer", fontFamily: T.font }}>Cancel</button>
          {importError && <span style={{ color: T.red, fontSize: 11 }}>{importError}</span>}
        </div>
      ) : (
        <button onClick={() => setShowImport(true)} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.accentBorder}`, background: T.accentDim, color: T.accentLight, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: T.font }}>+ Add Project</button>
      )}
    </>
  );

  if (vizardProjects.length === 0) {
    return (
      <div>
        <PageHeader title="Projects" subtitle="Vizard AI clip review">{importUI}</PageHeader>
        <Card style={{ padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{"\ud83c\udfac"}</div>
          <div style={{ color: T.textSecondary, fontSize: 15, fontWeight: 600 }}>No projects yet</div>
          <div style={{ color: T.textTertiary, fontSize: 13, marginTop: 8 }}>Upload files in the Upload tab or add an existing Vizard project by ID.</div>
        </Card>
      </div>
    );
  }

  // Sort: processing first, then ready, then done, then error
  const sorted = [...vizardProjects].sort((a, b) => {
    const order = { processing: 0, ready: 1, done: 2, error: 3 };
    const sa = order[getProjectStatus(a)] ?? 1;
    const sb = order[getProjectStatus(b)] ?? 1;
    if (sa !== sb) return sa - sb;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const processingCount = sorted.filter((p) => p.status === "processing").length;
  const readyCount = sorted.filter((p) => getProjectStatus(p) === "ready").length;

  return (
    <div>
      <PageHeader title="Projects" subtitle={`${vizardProjects.length} project${vizardProjects.length !== 1 ? "s" : ""}${processingCount > 0 ? ` \u00b7 ${processingCount} processing` : ""}${readyCount > 0 ? ` \u00b7 ${readyCount} to review` : ""}`}>{importUI}</PageHeader>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {sorted.map((p) => {
          const st = getProjectStatus(p);
          const gameColor = getGameColor(p, gamesDb);
          const clipCount = p.clips ? p.clips.length : 0;

          return (
            <Card
              key={p.id}
              onClick={() => (st === "ready" || st === "done") && onSelect(p)}
              borderColor={st === "done" ? T.greenBorder : st === "error" ? T.redBorder : T.border}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: 20, opacity: st === "processing" ? 0.7 : st === "error" ? 0.5 : 1,
                cursor: st === "ready" || st === "done" ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: T.radius.md,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                  background: st === "done" ? T.greenDim : st === "error" ? T.redDim : `${gameColor}18`,
                }}>
                  {st === "done" ? "\u2705" : st === "error" ? "\u274c" : st === "processing" ? "\u23f3" : "\ud83c\udfac"}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: T.text, fontSize: 16, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    {p.game && p.game !== "Unknown" && p.gameTag !== "?" && (
                      <span style={{
                        display: "inline-flex", padding: "2px 6px",
                        background: `${gameColor}18`, border: `1px solid ${gameColor}44`,
                        borderRadius: 4, fontSize: 10, fontWeight: 700, color: gameColor,
                        fontFamily: T.mono,
                      }}>
                        {p.gameTag || p.game}
                      </span>
                    )}
                    <span style={{ color: T.textTertiary, fontSize: 13 }}>
                      {st === "processing" ? (
                        <span>Processing{p.progress ? <span style={{ fontFamily: T.mono, color: T.yellow }}> {p.progress}%</span> : "..."}</span>
                      ) : st === "error" ? (
                        <span style={{ color: T.red }}>{p.error || "Failed"}</span>
                      ) : (
                        <><span style={{ fontFamily: T.mono }}>{clipCount}</span> clip{clipCount !== 1 ? "s" : ""}</>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <Badge color={st === "done" ? T.green : st === "processing" ? T.yellow : st === "error" ? T.red : T.accent}>
                {st === "done" ? "Done" : st === "processing" ? "Processing" : st === "error" ? "Error" : "Review"}
              </Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ============ CLIP BROWSER ============
export function ClipBrowser({ project, onBack, onUpdateClip, onTranscript, onEditClipTitle }) {
  const [filter, setFilter] = useState("all");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [titleHistory, setTitleHistory] = useState([]); // [{clipId, oldTitle, newTitle}]

  const clips = project.clips || [];
  const isApproved = (c) => c.status === "approved" || c.status === "ready";
  const filtered = clips.filter((c) => filter === "approved" ? isApproved(c) : filter === "pending" ? c.status === "none" : true);
  const approved = clips.filter(isApproved).length;
  const pending = clips.filter((c) => c.status === "none").length;

  return (
    <div>
      <PageHeader title={project.name} subtitle={`${approved} approved \u00b7 ${pending} pending`} backAction={onBack}>
        <span onClick={() => { navigator.clipboard.writeText(String(project.id)); }} title="Copy project ID" style={{ color: T.textTertiary, fontSize: 11, fontFamily: T.mono, cursor: "pointer", flexShrink: 0, padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}` }}>#{project.id}</span>
        {titleHistory.length > 0 && (
          <button onClick={() => {
            const last = titleHistory[titleHistory.length - 1];
            onEditClipTitle(project.id, last.clipId, last.oldTitle);
            setTitleHistory((h) => h.slice(0, -1));
          }} style={{ padding: "6px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.04)", color: T.textSecondary, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>
            {"\u21a9"} Undo rename
          </button>
        )}
      </PageHeader>

      <TabBar tabs={[{ id: "all", label: "All", count: clips.length }, { id: "pending", label: "Pending", count: pending }, { id: "approved", label: "Approved", count: approved }]} active={filter} onChange={setFilter} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {filtered.map((clip) => {
          const ca = isApproved(clip);
          const rej = clip.status === "rejected";
          return (
            <Card key={clip.id} borderColor={ca ? T.greenBorder : T.border} style={{ padding: 20, opacity: rej ? 0.35 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  {editId === clip.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={editText} onChange={(e) => setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { setTitleHistory((h) => [...h, { clipId: clip.id, oldTitle: clip.title, newTitle: editText }]); onEditClipTitle(project.id, clip.id, editText); setEditId(null); } if (e.key === "Escape") setEditId(null); }} autoFocus style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${T.accentBorder}`, borderRadius: T.radius.md, padding: "10px 14px", color: T.text, fontSize: 15, fontWeight: 600, fontFamily: T.font, outline: "none" }} />
                      <button onClick={() => { setTitleHistory((h) => [...h, { clipId: clip.id, oldTitle: clip.title, newTitle: editText }]); onEditClipTitle(project.id, clip.id, editText); setEditId(null); }} style={{ background: T.accent, border: "none", borderRadius: T.radius.md, padding: "10px 18px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font }}>Save</button>
                      <button onClick={() => setEditId(null)} style={{ background: "transparent", border: `1px solid ${T.border}`, borderRadius: T.radius.md, padding: "10px 14px", color: T.textTertiary, fontSize: 13, cursor: "pointer", fontFamily: T.font }}>Cancel</button>
                    </div>
                  ) : (
                    <div onClick={() => { setEditId(clip.id); setEditText(clip.title); }} style={{ color: T.text, fontSize: 16, fontWeight: 600, lineHeight: 1.5, cursor: "pointer" }}>{clip.title} <span style={{ color: T.textMuted, fontSize: 13 }}>{"\u270e"}</span></div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onUpdateClip(project.id, clip.id, ca ? "none" : "approved")} style={{ width: 42, height: 42, borderRadius: T.radius.md, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", border: ca ? `1px solid ${T.greenBorder}` : `1px solid ${T.border}`, cursor: "pointer", background: ca ? T.greenDim : "rgba(255,255,255,0.04)", color: ca ? T.green : T.textTertiary }}>{"\ud83d\udc4d"}</button>
                  <button onClick={() => onUpdateClip(project.id, clip.id, rej ? "none" : "rejected")} style={{ width: 42, height: 42, borderRadius: T.radius.md, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", border: rej ? `1px solid ${T.redBorder}` : `1px solid ${T.border}`, cursor: "pointer", background: rej ? T.redDim : "rgba(255,255,255,0.04)", color: rej ? T.red : T.textTertiary }}>{"\ud83d\udc4e"}</button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: T.textTertiary, fontSize: 13, fontFamily: T.mono }}>{clip.duration}s</span>
                {clip.viralScore > 0 && <ViralBar score={clip.viralScore} />}
              </div>
              {!rej && (
                <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: `1px solid ${T.border}`, marginTop: 14 }}>
                  <button onClick={() => onTranscript(clip)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.border}`, background: "rgba(255,255,255,0.03)", color: T.textSecondary, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: T.font }}>{"\ud83d\udcdd"} Transcript</button>
                  {ca && <Badge color={T.green}>{"\u2713"} Queued</Badge>}
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card style={{ padding: 40, textAlign: "center" }}>
            <div style={{ color: T.textTertiary, fontSize: 14 }}>No clips match this filter.</div>
          </Card>
        )}
      </div>
    </div>
  );
}
