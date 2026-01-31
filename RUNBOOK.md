> **Purpose**
> This document explains how the club web app is operated, deployed, and transferred.
> It intentionally contains **no secrets**. Sensitive access details live in a private vault (see below).

Absolutely — here’s a **clean, clickable Table of Contents** that matches the numbered sections in the runbook you’re using.

You can paste this **at the very top** of `RUNBOOK.md`.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Services](#2-core-services)
3. [Repository & Branching](#3-repository--branching)
4. [Deployments (Vercel)](#4-deployments-vercel)
5. [Environment Variables](#5-environment-variables)
6. [Payments (Stripe)](#6-payments-stripe)
7. [Authentication & Access](#7-authentication--access)
8. [Ownership Transfer (Critical)](#8-ownership-transfer-critical)
9. [Incident Response](#9-incident-response)
10. [Private Access & Secrets](#10-private-access--secrets-important)
11. [File Ownership & Docs](#11-file-ownership--docs)
12. [Change Log](#12-change-log)

---

## 1. System Overview

**Project name:**
`UNLV Mountain Club Web App`

**Description:**
Club web application for memberships, trips, and internal operations.

**Primary maintainer (current):**

* Name: `Daniel Valdecantos`
* Role: Maintainer / Developer
* Term: `01/30/2026 → "Present"`

---

## 2. Core Services

| Service          | Purpose               | Owner Email         | Notes                  |
| ---------------- | --------------------- | ------------------- | ---------------------- |
| GitHub           | Source code & issues  | `daniel.valdecantos@gmail.com` | Repo lives in club org |
| Vercel           | Hosting & deployments | `daniel.valdecantos@gmail.com` | Connected to GitHub    |
| Stripe           | Payments & dues       | `unlvmtnclub.tech@gmail.com` | Annual memberships     |
| Supabase         | Database & auth       | `daniel.valdecantos@gmail.com` | RLS enabled            |
| Domain Registrar | Domain & DNS          | `unlvmtnclub.tech@gmail.com` | Namecheap              |
| Email Provider   | Club tech inbox       | `unlvmtnclub.tech@gmail.com` | Used for infra only    |

> **Important:** The owner email above will be migrated to a **club-controlled tech email**, not a personal account.

---

## 3. Repository & Branching

**Repository location:**
`https://github.com/danielbuva/mtn-club`

**Default branch:**
`main`

**Branching model:**

* `main` → production-ready
* `feature/*` → active development
* (optional) `staging` → pre-release testing

---

## 4. Deployments (Vercel)

**Deployment trigger:**

* Automatic on push to `main`

**Environment types:**

* Production
* Preview (per PR)

**Where to manage settings:**

* Vercel Dashboard → Project → Settings

**Common issues:**

* Missing env vars
* Supabase RLS misconfiguration
* Stripe webhook signature mismatch

---

## 5. Environment Variables

Environment variables are managed in **Vercel**.

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
* `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
* `NEXT_PUBLIC_STRIPE_SECRET_KEY`

> Values are stored in the **private vault**, not in this repo.

---

## 6. Payments (Stripe)

**Payment model:**

* Annual membership dues

**Key components:**

* Products & Prices in Stripe Dashboard
* Webhooks to `/api/webhooks/stripe`

**If payments fail:**

1. Check Stripe Dashboard → Events
2. Verify webhook endpoint status
3. Confirm webhook secret in Vercel

---

## 7. Authentication & Access

**Authentication model:**

* GitHub, Vercel, Stripe, and Domain accounts all use:

  * Password + TOTP (Authenticator)
  * Recovery codes enabled

**2FA policy:**

* No SMS-only 2FA - do not add SMS
* TOTP secrets and recovery codes are stored privately

---

## 8. Ownership Transfer (Critical)

If the maintainer steps down:

1. Promote new maintainer/officer in:

   * GitHub org
   * Vercel team
   * Stripe team
2. Transfer account ownership where applicable
3. Rotate:

   * Passwords
   * API keys
   * Webhook secrets
4. Update this `RUNBOOK.md`
5. Update the **private access vault**

> This process ensures no single person is a point of failure.

---

## 9. Incident Response

**If the site is down:**

1. Check Vercel deployment logs
2. Check Supabase status
3. Roll back last deployment if needed

**If payments stop:**

1. Check Stripe webhooks
2. Verify API keys
3. Review recent Stripe events

---

## 10. Private Access & Secrets (IMPORTANT)

Sensitive credentials are **not** stored in this repository.

They are stored in:

* **Private vault:** `Bitwarden Organization`

Access is limited to:

* Current maintainer
* Current club officers (President / Treasurer)

---

## 11. File Ownership & Docs

**Public docs:**

* `RUNBOOK.md`

**Private docs:**

* Credentials
* Recovery codes
* Identity verification info

---

## 12. Change Log

| Date     | Change                  | Author        |
| -------- | ----------------------- | ------------- |
| `01/30/2025` | Initial runbook created | `Daniel Valdecantos` |

---
