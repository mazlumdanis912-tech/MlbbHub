---
name: MLBB Hub AI Chatbot
description: Architecture and security decisions for the AI-powered support chatbot
---

# AI Chatbot Architecture

## Stack
- **Backend:** Express route `artifacts/api-server/src/routes/chatbot.ts`, uses `openai` package directly with `OPENAI_API_KEY` (user's own key)
- **Model:** `gpt-4o-mini` (cost-effective; upgrade to gpt-4o if quality issues arise)
- **DB:** `chatbot_solutions` Drizzle table for community-sourced memory (learning feature)
- **Mobile client:** `artifacts/mlbb-hub/utils/chatApi.ts` → `sendChatMessage`, `storeSolution`

## Security decisions
**Why:** Code review flagged two critical issues.
1. **Rate limiting:** `express-rate-limit` — 20 req/min per IP on `/api/chat`, 30/hr on `/api/chat/solution`
2. **Prompt injection isolation:** Untrusted content (DB solutions, web search results) is wrapped in explicit `--- BAŞLANGICI/BİTİŞİ ---` delimiter blocks inside the system prompt, NOT mixed with trusted instructions

## Message-feedback pairing
**How to apply:** Each assistant `Message` has an `answerTo: string` field containing the ID of the user message it answers. `markHelpful` uses this field — never positional slice — to find the correct question for `storeSolution`.

## Web search
DuckDuckGo Instant Answers API (free, no key) — 5 s timeout, graceful fallback. Toggled by user via Switch in the header.

## Profile access
Profile quick-actions array includes `{ icon: '🐉', label: 'Canlı Destek', onPress: router.push('/(tabs)/support') }` as the last item before logout.
