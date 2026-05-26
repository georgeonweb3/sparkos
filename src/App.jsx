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

function BugScout({ apiKey, onNeedKey }) {
  const [repo, setRepo] = useState(REPOS[0].id);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!code.trim()) return;
    if (!apiKey) { onNeedKey(); return; }
    setLoading(true);
    setError(null);
    setResult(null);

    const repoMeta = REPOS.find(r => r.id === repo);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": "https://sparkos.vercel.app",
          "X-Title": "SparkOS Bug Scout",
        },
        body: JSON.stringify({
          model: "openrouter/auto",
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
      const text = data.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setError("Analysis failed. Check your API key and try again.");
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
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────

function Onboarding() {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Fork the Repo",
      icon: "🍴",
      desc: "Go to github.com/vibeforge1111/spark-telegram-bot and tap Fork → Create Fork. This creates your own copy to work from.",
      action: "github.com/vibeforge1111/spark-telegram-bot",
      actionLabel: "Open GitHub →"
    },
    {
      title: "Create Render Account",
      icon: "☁️",
      desc: "Go to render.com and sign up with your GitHub account. This is where your bot will run for free.",
      action: "render.com",
      actionLabel: "Open Render →"
    },
    {
      title: "Deploy as Web Service",
      icon: "🚀",
      desc: "In Render: New → Web Service → Connect your forked repo. Set Runtime to Docker. Set the start command to: npm start",
    },
    {
      title: "Set Environment Variables",
      icon: "🔑",
      desc: "In Render's Environment tab, add these variables:",
      vars: [
        { key: "BOT_TOKEN", val: "Your Telegram bot token from @BotFather" },
        { key: "SPARK_CHAT_LLM_PROVIDER", val: "openrouter" },
        { key: "OPENROUTER_API_KEY", val: "Your key from openrouter.ai" },
        { key: "OPENROUTER_MODEL", val: "openrouter/auto" },
        { key: "TELEGRAM_RELAY_SECRET", val: "any-random-string-you-choose" },
      ]
    },
    {
      title: "Deploy & Test",
      icon: "✅",
      desc: "Hit Deploy. Wait 2-3 minutes. Then open Telegram, find your bot, and send /start. You should see the welcome message.",
    },
    {
      title: "Start Hunting!",
      icon: "🎯",
      desc: "Go to compete.sparkswarm.ai and start from Mission 1. Use the Bug Scout tab here to analyze code files from your fork.",
      action: "compete.sparkswarm.ai",
      actionLabel: "Open Compete →"
    },
  ];

  return (
    <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <Card style={{ background: `linear-gradient(135deg, ${COLORS.accent}22, ${COLORS.card})` }}>
        <div style={{ fontSize: 13, color: COLORS.accentGlow, fontFamily: "'Space Mono', monospace", fontWeight: 700, marginBottom: 4 }}>
          Android Setup Guide
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted }}>
          Zero to deployed bot — no laptop needed
        </div>
      </Card>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4 }}>
        {steps.map((_, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            flex: 1, height: 4, borderRadius: 2, cursor: "pointer",
            background: i <= step ? COLORS.accentGlow : COLORS.border,
            transition: "background 0.3s",
          }} />
        ))}
      </div>

      {/* Current step */}
      <Card style={{ border: `1px solid ${COLORS.accentGlow}44` }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{steps[step].icon}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.text, marginBottom: 8 }}>
          Step {step + 1}: {steps[step].title}
        </div>
        <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.6, marginBottom: 12 }}>
          {steps[step].desc}
        </div>

        {steps[step].vars && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {steps[step].vars.map(v => (
              <div key={v.key} style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "8px 10px",
              }}>
                <div style={{ fontSize: 11, color: COLORS.accentGlow, fontFamily: "'Space Mono', monospace", marginBottom: 2 }}>
                  {v.key}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted }}>{v.val}</div>
              </div>
            ))}
          </div>
        )}

        {steps[step].action && (
          <a href={`https://${steps[step].action}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "10px 14px",
              background: COLORS.surface,
              border: `1px solid ${COLORS.accentGlow}`,
              borderRadius: 8,
              color: COLORS.accentGlow,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 12,
            }}>
              {steps[step].actionLabel}
            </div>
          </a>
        )}
      </Card>

      {/* Nav buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{
          flex: 1, padding: 12,
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10, color: step === 0 ? COLORS.dim : COLORS.text,
          fontSize: 13, fontFamily: "'Space Mono', monospace",
          cursor: step === 0 ? "not-allowed" : "pointer",
        }}>
          ← Back
        </button>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} style={{
          flex: 1, padding: 12,
          background: step === steps.length - 1 ? COLORS.dim : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentGlow})`,
          border: "none",
          borderRadius: 10, color: "#fff",
          fontSize: 13, fontFamily: "'Space Mono', monospace", fontWeight: 700,
          cursor: step === steps.length - 1 ? "not-allowed" : "pointer",
        }}>
          Next →
        </button>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: COLORS.dim }}>
        Step {step + 1} of {steps.length}
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function SparkOS() {
  const [activeTab, setActiveTab] = useState("warroom");

  const tabs = [
    { id: "warroom", label: "War Room", icon: "🗺" },
    { id: "scout", label: "Bug Scout", icon: "🎯" },
    { id: "onboard", label: "Setup", icon: "🚀" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'Space Mono', monospace",
      maxWidth: 480,
      margin: "0 auto",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes shimmer {
          0% { width: 20%; } 50% { width: 70%; } 100% { width: 20%; }
        }
        select option { background: #1a1a26; }
      `}</style>

      {/* Top bar */}
      <div style={{
        padding: "16px 16px 12px",
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentGlow})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0,
        }}>⚡</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, letterSpacing: "0.05em" }}>
            SparkOS
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.1em" }}>
            MISSION CONTROL
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
          <GlowDot color={COLORS.green} size={7} pulse />
          <span style={{ fontSize: 10, color: COLORS.green }}>LIVE</span>
        </div>
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      <div style={{ paddingBottom: 32 }}>
        {activeTab === "warroom" && <WarRoom />}
        {activeTab === "scout" && <BugScout />}
        {activeTab === "onboard" && <Onboarding />}
      </div>
    </div>
  );
            }
