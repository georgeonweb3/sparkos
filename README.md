# SparkOS

I built this because I needed it.

Spent 6+ hours getting Spark running on Android — no laptop, 
just a phone and stubbornness. By the time the bot was live I 
had learned enough about the ecosystem to know three things:

1. The bug hunt is real but flying blind
2. The submission process will eat your time if you let it
3. Nobody had built tooling for this yet

So I built SparkOS.

---

## What it does

**War Room** — pulls live PRs from all 7 Spark repos and 
renders them as a heatmap. Red means hot (lots of activity), 
green means opportunity. Compete PRs surface separately so 
you can see what's already been claimed before you spend an 
hour on a duplicate.

**Bug Scout** — paste any file from a Spark repo and an AI 
reads it for real bugs. Not surface-level stuff. It looks for 
silent failures, ESM compatibility issues, missing error 
boundaries, race conditions. Each finding comes with a 
one-tap button that generates a submission-ready 
spark-compete-hotfix-v1 packet.

**Setup Guide** — the Android onboarding flow I wish existed 
when I started. Step by step, no laptop required.

**Settings** — plug in your OpenRouter key and Bug Scout 
comes alive. Free tier works fine.

---

## Stack

React + Vite, deployed on Vercel. OpenRouter for the AI 
layer. GitHub public API for live repo data. No backend. 
No database. Runs entirely in the browser.

---

## Live

https://sparkos-ul58.vercel.app

---

## Why it matters for Spark

Most compete participants are hunting blind — no visibility 
into what's been found, no tooling to speed up the 
submission process, no clear path for Android or 
low-resource setups.

SparkOS fixes all three. The War Room alone changes how 
you approach the hunt. Instead of guessing where bugs are, 
you can see which repos are oversaturated and where the 
white space is.

Built on Base. Built for Spark. Built from a phone.

---

## Team

@georgeonweb3
