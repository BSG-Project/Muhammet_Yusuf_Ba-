# AGENT.md - Project Context & Rules

## 1. Project Overview
This project is a Proof of Concept (PoC) visualization of an OCPP Security Vulnerability described in "Bsg_1.pdf".
**Scenario:** Information Disclosure via `GetDiagnostics` misuse.
[cite_start]**Goal:** Demonstrate how an attacker, using legitimate CSMS commands, can force a Charge Point (CP) to upload sensitive configuration files (containing passwords) to an untrusted server[cite: 3, 4, 7].

## 2. Architecture Components
1.  **Steve CSMS:** Open-source OCPP server running via Docker (Background service).
2.  **Vulnerable CP (Simulator):** Node.js app simulating an OCPP 1.6J charger. [cite_start]It has a vulnerability: NO sanitization of logs before upload[cite: 12].
3.  **Attacker Server:** Node.js app acting as the rogue FTP/HTTP server receiving stolen data.
4.  **Dashboard:** Next.js (React) application for the presentation. It connects to the Attacker Server via Socket.io to visualize the attack in real-time.

## 3. Tech Stack (Strict Versioning)
-   **Runtime:** Node.js v20 (LTS)
-   **Frontend:** Next.js 14 (App Router), React 18
-   **Styling:** Tailwind CSS 3.4, Framer Motion (for animations), Lucide React (icons).
-   **UI Components:** Shadcn/UI (Radix Primitives).
-   **Backend/Scripting:** TypeScript 5.x.
-   **Communication:**
    -   OCPP: `ws` (WebSocket) or dedicated OCPP library.
    -   Real-time Dashboard: `socket.io` v4.
-   **Containerization:** Docker Compose v2.

## 4. Coding Standards
-   **Strict Versioning:** Remove `^` or `~` from `package.json` to lock versions.
-   **Language:** English for code (variables, comments), Turkish for UI text (Presentation language).
-   **Style:** "Clean Corporate" - Professional, white/gray/blue palette, clear typography, data-dense but readable (like a SIEM dashboard).
-   **Error Handling:** All async operations must have try/catch blocks. The CP Simulator should log errors but not crash.

## 5. Security Simulation Rules
-   [cite_start]**The Vulnerability:** The Simulator MUST include a mock file system containing fake sensitive data (e.g., `wpa_supplicant.conf` with cleartext passwords)[cite: 21].
-   **The Trigger:** The Simulator listens for `GetDiagnostics`. [cite_start]It DOES NOT validate the destination URL[cite: 14].

## 6. Implementation Plan
Phase 1: Setup Docker & Monorepo.
Phase 2: Build Attacker Server (The listener).
Phase 3: Build Vulnerable CP (The victim).
Phase 4: Build Dashboard (The view).