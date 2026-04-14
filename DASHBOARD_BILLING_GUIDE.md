# Brimble Billing System — Frontend Guide

> How billing works on Brimble. Use this to make correct decisions when building billing-related UI on the dashboard.

---

## Plans

Brimble has four plans: **Free**, **Hacker**, **Pro**, and **Team**.

The first three are **personal plans** — they belong to an individual user. Every user is on exactly one personal plan at a time. The upgrade path is linear:

```
Free → Hacker → Pro
```

**Team** is not part of this hierarchy. It's a separate subscription that lives alongside the personal plan. A user on the Free plan can be part of a team. A user on Pro can also have a team. They don't replace each other.

---

## What each plan gives you

|                   | Free       | Hacker   | Pro       | Team                                 |
| ----------------- | ---------- | -------- | --------- | ------------------------------------ |
| Price             | $0/mo      | $7/mo    | $19/mo    | (members × $5) + (builds × $7.50)/mo |
| Projects          | 5          | 10       | 150       | 500                                  |
| Bandwidth         | 10 GB/mo   | 30 GB/mo | 150 GB/mo | 500 GB/mo                            |
| Concurrent builds | 0 (queued) | 1        | 2         | 2                                    |
| Team members      | —          | —        | —         | Configurable                         |
| PR previews       | No         | No       | Yes       | Yes                                  |
| Analytics         | No         | No       | Yes       | Yes                                  |
| Org git deploy    | No         | Yes      | Yes       | Yes                                  |
| Autoscaling       | No         | No       | Yes       | Yes                                  |
| Log retention     | 3 days     | 7 days   | 30 days   | 30 days                              |

---

## Workspaces

The dashboard uses a **workspace** model. A workspace is just a context the user operates in.

- **Personal workspace**: Every user has one. It reflects their personal plan (Free, Hacker, or Pro). Their personal projects live here.
- **Team workspace**: Created when someone subscribes to the Team plan. Has its own projects, its own members, its own billing. A user can belong to multiple team workspaces.

A user switches between workspaces. The workspace they're in determines what projects they see, what limits apply, and what billing info is shown.

---

## How subscriptions attach

- A **personal subscription** (Free/Hacker/Pro) is tied to the user. One per user, always.
- A **team subscription** is tied to a team entity. The user who created the team is the **Creator** and initially pays for it. Billing can be transferred to another team member.
- These are independent. Upgrading your personal plan doesn't touch your team subscription. Creating a team doesn't change your personal plan.

---

## Team roles

Teams have three roles:

- **Creator** — made the team, full control, can't be removed
- **Administrator** — same permissions as Creator (billing, invites, settings)
- **Member** — can use the team workspace but can't manage billing or members

---

## How upgrades work

When a user upgrades (e.g., Free → Hacker), their existing subscription record gets updated. It's not a new subscription — it's the same one with a new plan type. The card is charged and the new features are available immediately.

If someone upgrades mid-billing-cycle (e.g., Hacker → Pro halfway through the month), they're **not charged again immediately**. The plan switches, and the new price kicks in on the next billing date.

---

## How downgrades work

Downgrades are **not instant**. When a user downgrades (e.g., Pro → Free), the current plan stays active until the end of the billing period. The user keeps all their current features until then. After the period ends, the plan switches and the lower limits apply.

If the user has more projects than the new plan allows, those projects aren't deleted right away — there's a grace period. But they can't create new projects beyond the new limit.

---

## How team billing works

Team plan pricing is dynamic based on configuration:

```
Monthly cost = (number of members × $5) + (concurrent builds × $7.50)
```

When members or builds are added/removed, the cost recalculates. The person whose card gets charged is tracked separately and can be changed by the Creator or an Administrator ("transfer billing").

---

## Backend naming

The backend uses `DEVELOPER_PLAN` internally for what we call "Pro" in the UI. Always map:

| Backend sends    | UI shows |
| ---------------- | -------- |
| `FREE_PLAN`      | Free     |
| `HACKER_PLAN`    | Hacker   |
| `DEVELOPER_PLAN` | Pro      |
| `TEAM_PLAN`      | Team     |

---

## Overage

When a user exceeds their plan's bandwidth, they're charged overage at **$0.25/GB**. Build minutes over the allocation cost **$0.002/min**. The subscription stays active — overages are added to the next bill.

---

## Payment methods

Users can have up to **3 cards**. One is marked as default. Cards are added via redirect to Stripe or Paystack (never an inline form on our side). When a recurring charge fails, the system retries. After 7 days of failures, builds get disabled. After 14 failed attempts, the subscription is deactivated.

---

## Key things to keep in mind

- Personal plans and team plans are **independent**. Don't treat Team as an upgrade from Pro.
- Downgrades are **pending**, not instant. The user keeps current features until the billing period ends.
- Every user is always on exactly **one** personal plan. They can additionally be in **multiple** teams.
- The workspace concept is a **frontend construct**. The backend just has users, teams, and subscriptions.
- Free plan's 0 concurrent builds means builds are **queued**, not disabled.

---

_February 2026_
