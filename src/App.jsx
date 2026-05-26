import { useState, useEffect, useCallback } from "react";

const REPOS = [
  { id: "vibeforge1111/spark-telegram-bot", label: "Telegram Bot", surface: "telegram-bot" },
  { id: "vibeforge1111/spark-cli", label: "Spark CLI", surface: "spark-cli" },
  { id: "vibeforge1111/Spark-Agent-Site", label: "Agent Site", surface: "agent-site" },
  { id: "vibeforge1111/vibeship-spawner-ui", label: "Spawner UI", surface: "spawner-ui" },
  { id: "vibeforge1111/spark-intelligence-builder", label: "Intelligence Builder", surface: "spark-intelligence-builder" },
  { id: "vibeforge1111/spark-character", label: "Character", surface: "spark-character" },
  { id: "vibeforge1111/spark-researcher", label: "Researcher", surface: "spark-researcher" },
];

const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  card: "#1a1a26",
  border: "#2a2a3e",
  accent: "#7c3aed",
  accentGlow: "#9d5bf4",
  green: "#10b981",
  yellow: "#f59e0b",
  red: "#ef4444",
  text: "#e2e8f0",
  muted: "#64748b",
  dim: "#334155",
};

function GlowDot({ color = COLORS.green, size = 8, pulse = false }) {
  return (
    <span style={{
      display: "inline-block",
      width: size, height: size,
      borderRadius: "50%",
      background: color,
      boxShadow: `0 0 ${size}px ${color}`,
      animation: pulse ? "pulse 1.5s infinite" : "none",
      flexShrink: 0,
    }} />
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: "flex",
      background: COLORS.surface,
      borderBottom: `1px solid ${COLORS.border}`,
      overflowX: "auto",
      scrollbarWidth: "none",
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1,
          minWidth: 80,
          padding: "12px 8px",
          background: "none",
          border: "none",
          borderBottom: active === t.id ? `2px solid ${COLORS.accentGlow}` : "2px solid transparent",
          color: active === t.id ? COLORS.accentGlow : COLORS.muted,
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          fontWeight: active === t.id ? 700 : 400,
          cursor: "pointer",
          transition: "all 0.2s",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ label, color = COLORS.accent }) {
  return (
    <span style={{
      background: color + "22",
      color: color,
      border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: "2px 8px",
      fontSize: 10,
      fontFamily: "'Space Mono', monospace",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}>
      {label}
    </span>
  );
}

// ── WAR ROOM ──────────────────────────────────────────────────────────────────

function WarRoom() {
  const [prs, setPrs] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [selected, setSelected] = useState(null);

  const fetchRepo = useCallback(async (repo) => {
    setLoading(l => ({ ...l, [repo.id]: true }));
    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo.id}/pulls?state=open&per_page=20`
      );
      const data = await res.json();
      setPrs(p => ({ ...p, [repo.id]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      setErrors(err => ({ ...err, [repo.id]: "Failed to fetch" }));
    } finally {
      setLoading(l => ({ ...l, [repo.id]: false }));
    }
  }, []);

  useEffect(() => {
    REPOS.forEach(r => fetchRepo(r));
  }, [fetchRepo]);

  const allPRs = REPOS.flatMap(r => (prs[r.id] || []).map(pr => ({ ...pr, _repo: r })));
  const sparkPRs = allPRs.filter(pr =>
    pr.title?.toLowerCase().includes("spark-compete") ||
    pr.labels?.some(l => l.name?.includes("spark"))
  );
  const totalOpen = allPRs.length;
  const competePRs = sparkPRs.length;

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { label: "Open PRs", value: totalOpen, color: COLORS.green },
          { label: "Compete", value: competePRs, color: COLORS.accentGlow },
          { label: "Repos", value: REPOS.length, color: COLORS.yellow },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: "center", padding: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Space Mono', monospace" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* Repo heatmap */}
      <Card>
        <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          🗺 Bug Heatmap
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {REPOS.map(r => {
            const count = (prs[r.id] || []).length;
            const isLoading = loading[r.id];
            const maxCount = Math.max(...REPOS.map(x => (prs[x.id] || []).length), 1);
            const pct = count / maxCount;
            const heat = pct > 0.7 ? COLORS.red : pct > 0.3 ? COLORS.yellow : COLORS.green;

            return (
              <div key={r.id}
                onClick={() => setSelected(selected === r.id ? null : r.id)}
                style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <GlowDot color={heat} size={7} />
                  <span style={{ fontSize: 12, color: COLORS.text, flex: 1 }}>{r.label}</span>
                  <span style={{ fontSize: 11, color: heat, fontFamily: "'Space Mono', monospace" }}>
                    {isLoading ? "…" : count}
                  </span>
                </div>
                <div style={{ height: 4, background: COLORS.border, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: isLoading ? "30%" : `${pct * 100}%`,
                    background: heat,
                    borderRadius: 2,
                    transition: "width 0.6s ease",
                    animation: isLoading ? "shimmer 1s infinite" : "none",
                  }} />
                </div>

                {/* Expanded PR list */}
                {selected === r.id && (prs[r.id] || []).length > 0 && (
                  <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                    {(prs[r.id] || []).slice(0, 5).map(pr => (
                      <div key={pr.id} style={{
                        background: COLORS.surface,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        padding: "8px 10px",
                      }}>
                        <div style={{ fontSize: 11, color: COLORS.text, marginBottom: 4 }}>
                          #{pr.number} {pr.title?.slice(0, 60)}{pr.title?.length > 60 ? "…" : ""}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <Badge label={pr.user?.login || "unknown"} color={COLORS.muted} />
                          {pr.labels?.map(l => (
                            <Badge key={l.id} label={l.name} color={
                              l.name.includes("valid") ? COLORS.red :
                              l.name.includes("compete") ? COLORS.accentGlow : COLORS.muted
                            } />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent compete PRs */}
      {competePRs > 0 && (
        <Card>
          <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
            ⚡ Compete PRs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sparkPRs.slice(0, 6).map(pr => (
              <a key={pr.id} href={pr.html_url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <div style={{
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.accentGlow}33`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                }}>
                  <div style={{ fontSize: 12, color: COLORS.text }}>
                    {pr.title?.slice(0, 65)}{pr.title?.length > 65 ? "…" : ""}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Badge label={pr._repo.label} color={COLORS.accentGlow} />
                    <Badge label={`@${pr.user?.login}`} color={COLORS.muted} />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── BUG SCOUT ─────────────────────────────────────────────────────────────────

function BugScout() {
  const [repo, setRepo] = useState(REPOS[0].id);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("bugs"); // bugs | packet

  const analyze = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const repoMeta = REPOS.find(r => r.id === repo);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a bug hunter analyzing code from the Spark Telegram Bot repo (${repoMeta.label}, surface: ${repoMeta.surface}).

Analyze this code and find real bugs — silent failures, missing error handling, bad UX, edge cases, crashes, state issues.

For each bug found, provide:
1. A short title
2. Severity (low/medium/high)
3. Type (usage_friction/crash/silent_failure/ux_bug)
4. Affected workflow
5. What actually happens (actual_behavior)
6. What should happen (expected_behavior)
7. Repro steps (3-4 steps)
8. Proposed fix approach
9. Files to change

Respond ONLY in this exact JSON format, no markdown, no preamble:
{
  "bugs": [
    {
      "title": "...",
      "severity": "medium",
      "type": "usage_friction",
      "affected_workflow": "...",
      "actual_behavior": "...",
      "expected_behavior": "...",
      "repro_steps": ["step1", "step2", "step3"],
      "fix_approach": "...",
      "files_expected": ["src/..."]
    }
  ]
}

Code to analyze:
\`\`\`
${code.slice(0, 3000)}
\`\`\``
          }]
        })
      });

      const data = await response.json();
      const text = data.content?.map(i => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setTab("bugs");
    } catch (e) {
      setError("Analysis failed. Check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const buildPacket = (bug, idx) => {
    return JSON.stringify({
      schema: "spark-compete-hotfix-v1",
      event: "spark-compete-first-event",
      submission_mode: "public_repo_pr",
      submission_target_url: `https://github.com/${repo}/pull/YOUR_PR_NUMBER`,
      team: {
        name: "YOUR_TEAM_NAME",
        members: ["member1", "member2", "member3"],
        llm_device_holder: "member1",
        device_holder_github: "https://github.com/member1",
        github_accounts: ["member1", "member2", "member3"]
      },
      target_repo: {
        id: repo,
        source: `https://github.com/${repo}`,
        owner_surface: REPOS.find(r => r.id === repo)?.surface
      },
      issue: {
        type: bug.type,
        severity: bug.severity,
        title: bug.title,
        actual_behavior: bug.actual_behavior,
        expected_behavior: bug.expected_behavior,
        repro_steps: bug.repro_steps,
        affected_workflow: bug.affected_workflow
      },
      evidence: {
        safe_links_only: true,
        before_after_proof: `Before: ${bug.actual_behavior}. After: ${bug.expected_behavior}. Screenshots attached to PR.`,
        links: [`https://github.com/${repo}/pull/YOUR_PR_NUMBER`],
        forbidden: ["pdf", "zip", "exe", "unknown downloads", "shortened links", "tokens", "browser cookies", "wallet material", "raw logs", "raw conversations", "chat IDs", "private usernames", "bot tokens", "private messages"]
      },
      proposed_fix: {
        approach: bug.fix_approach,
        files_expected: bug.files_expected,
        tests_or_smoke: "Manually verified before and after fix. Screenshots attached to PR."
      },
      pr: {
        branch: `spark-compete/${bug.title.toLowerCase().replace(/\s+/g, "-").slice(0, 40)}`,
        title_prefix: "[spark-compete]",
        author_github: "YOUR_GITHUB",
        body_must_include: ["packet", "team", "pr_author", "repo", "actual_behavior", "expected_behavior", "repro_steps", "before_after_proof", "tests_or_smoke", "duplicate_notes", "risk_notes", "review_claim"],
        url: `https://github.com/${repo}/pull/YOUR_PR_NUMBER`
      },
      review_claim: {
        impact_claim: bug.severity,
        evidence_types: ["redacted_conversation_excerpt", "smoke_test"],
        duplicate_notes: "Searched open and closed PRs. No existing PR addresses this issue.",
        risk_notes: "Low risk. Targeted fix with no auth, CI, dependency, or security surface changes.",
        review_state_requested: "pr_review"
      }
    }, null, 2);
  };

  const [selectedBug, setSelectedBug] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyPacket = (bug) => {
    navigator.clipboard.writeText(buildPacket(bug));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
          🎯 Target Repo
        </div>
        <select value={repo} onChange={e => setRepo(e.target.value)} style={{
          width: "100%",
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 13,
          fontFamily: "'Space Mono', monospace",
          marginBottom: 12,
        }}>
          {REPOS.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>

        <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
          📋 Paste Code to Analyze
        </div>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste file contents here (e.g. src/index.ts)..."
          style={{
            width: "100%",
            minHeight: 140,
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.text,
            borderRadius: 8,
            padding: 12,
            fontSize: 12,
            fontFamily: "'Space Mono', monospace",
            resize: "vertical",
            boxSizing: "border-box",
          }}
        />

        <button onClick={analyze} disabled={loading || !code.trim()} style={{
          width: "100%",
          marginTop: 12,
          padding: "14px",
          background: loading ? COLORS.dim : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentGlow})`,
          border: "none",
          borderRadius: 10,
          color: "#fff",
          fontSize: 14,
          fontFamily: "'Space Mono', monospace",
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.05em",
          transition: "all 0.2s",
        }}>
          {loading ? "⚡ Scanning for bugs..." : "⚡ Scan for Bugs"}
        </button>
        {error && <div style={{ marginTop: 10, color: COLORS.red, fontSize: 12 }}>{error}</div>}
      </Card>

      {result && result.bugs && (
        <>
          <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            🐛 {result.bugs.length} Bug{result.bugs.length !== 1 ? "s" : ""} Found
          </div>

          {result.bugs.map((bug, i) => (
            <Card key={i} style={{ border: `1px solid ${
              bug.severity === "high" ? COLORS.red + "66" :
              bug.severity === "medium" ? COLORS.yellow + "66" : COLORS.border
            }` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <GlowDot color={
                  bug.severity === "high" ? COLORS.red :
                  bug.severity === "medium" ? COLORS.yellow : COLORS.green
                } size={8} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: COLORS.text, fontWeight: 600, marginBottom: 6 }}>
                    {bug.title}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge label={bug.severity} color={
                      bug.severity === "high" ? COLORS.red :
                      bug.severity === "medium" ? COLORS.yellow : COLORS.green
                    } />
                    <Badge label={bug.type} color={COLORS.accentGlow} />
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>ACTUAL</div>
              <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 10, lineHeight: 1.5 }}>{bug.actual_behavior}</div>

              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>EXPECTED</div>
              <div style={{ fontSize: 12, color: COLORS.green, marginBottom: 10, lineHeight: 1.5 }}>{bug.expected_behavior}</div>

              <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 4 }}>FIX</div>
              <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 12, lineHeight: 1.5 }}>{bug.fix_approach}</div>

              <button onClick={() => copyPacket(bug)} style={{
                width: "100%",
                padding: "10px",
                background: COLORS.surface,
                border: `1px solid ${COLORS.accentGlow}`,
                borderRadius: 8,
                color: COLORS.accentGlow,
                fontSize: 12,
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}>
                {copied ? "✓ Copied!" : "📋 Copy Submission Packet"}
              </button>
            </Card>
          ))}
        </>
      )}
    </
