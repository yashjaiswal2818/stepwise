# Security Policy

## Reporting a vulnerability

Please **don't** open a public issue for a security problem.

Report it privately through GitHub's [Report a vulnerability](https://github.com/yashjaiswal2818/stepwise/security/advisories/new) form. That opens a private advisory only the maintainer can see.

Include what you can: what the issue is, how to reproduce it, and what an attacker could do with it.

## What to expect

This is a solo-maintained project, so response times are best-effort — expect an acknowledgement within about a week. If the issue is confirmed I'll work on a fix and credit you in the advisory unless you'd rather stay anonymous.

## Scope

Most relevant to this project:

- Anything that exposes another user's data (conversations, progress) across accounts
- Authentication or session handling flaws
- Ways to bypass rate limiting and run up API cost
- Server-side secret exposure (API keys reaching the browser)

## Out of scope

- Missing rate limits on a self-hosted deploy where the operator hasn't configured Upstash
- Vulnerabilities requiring a compromised OpenRouter/Neon/GitHub account
- Automated scanner output without a demonstrated impact

## For self-hosters

If you run your own instance, set a spend cap with your AI provider and configure Upstash Redis for rate limiting. Without distributed rate limiting, a single user can drive up your API bill.
