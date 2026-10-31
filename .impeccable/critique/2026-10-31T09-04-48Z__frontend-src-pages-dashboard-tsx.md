---
target: $impeccable critique frontend/src/pages/Dashboard.tsx
total_score: 23
max_score: 36
na_heuristics: 7
p0_count: 0
p1_count: 3
target_identity: "file:C:\\PTKOM\\PTKOM-03\\frontend\\src\\pages\\Dashboard.tsx"
target_fingerprint: "sha256:53942cc311f8acd51175785d79a8cad78ea1216211fd17114659c3ab791936e8"
target_path: "C:\\PTKOM\\PTKOM-03\\frontend\\src\\pages\\Dashboard.tsx"
timestamp: 2026-10-31T09-04-48Z
slug: frontend-src-pages-dashboard-tsx
closed: true
---
Method: dual-agent (A: /root/critique_design_review · B: /root/critique_detector_evidence)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|---:|---|
| 1 | Visibility of System Status | 2/4 | Bacaan disappears when the article list is empty; loading and error are not distinguished. |
| 2 | Match System / Real World | 3/4 | Indonesian copy and campus context fit; the phase timeline needs clear context. |
| 3 | User Control and Freedom | 3/4 | Sign-in exists, but the temperature-tracking CTA hides its authentication requirement. |
| 4 | Consistency and Standards | 3/4 | Shared cards, colors, and typography are consistent; the mini-game is a different interaction among health tasks. |
| 5 | Error Prevention | 2/4 | Visitors can select “Catat Suhu Harian” before learning the destination requires login. |
| 6 | Recognition Rather Than Recall | 3/4 | The two main actions and three-phase guide are labeled; the article list makes the page longer. |
| 7 | Flexibility and Efficiency | n/a | Not meaningful for this persuasion-oriented homepage. |
| 8 | Aesthetic and Minimalist Design | 2/4 | The hero combines several competing focuses, followed by full-length articles. |
| 9 | Error Recovery | 2/4 | A content-loading failure can look like content is simply unavailable. |
| 10 | Help and Documentation | 3/4 | Education is available, but screening and tracking entry points lack contextual help. |
| **Total** |  | **23/36** | **Acceptable (64%)** |

## Design Specificity Verdict

**LLM assessment:** The homepage feels authored for CekDBD: campus context, dengue-specific guidance, emergency contacts, and symptom/temperature actions provide product character. The main opportunity is to clarify the health-action priority and reduce competition from the mini-game.

**Deterministic scan:** The detector ran on the target and returned `[]` (no findings). This does not rule out the UX issues found through code review.

**Visual overlays:** Browser automation was unavailable, so no rendered-page inspection or overlay was gathered. Visual judgments are provisional and based on source components and styles.

## Overall Impression

The homepage provides useful information early and points visitors toward relevant actions. The mini-game, an undisclosed sign-in requirement, and long articles weaken the clarity of the primary health path.

## What's Working

- The hero offers clearly labeled actions for symptom screening and temperature tracking.
- Danger signs appear early, with campus clinic and hospital contacts nearby.
- The three-phase guide turns complex information into a scannable structure.

## Priority Issues

1. **[P1] Emergency number is not directly actionable.** In `Dashboard.tsx`, “Hubungi 119” is plain text. Phone visitors must copy or type the number in a potentially urgent situation. Make it a `tel:119` link and retain its visual emphasis. Suggested command: `$impeccable clarify frontend/src/pages/Dashboard.tsx`.
2. **[P1] Temperature CTA hides the sign-in requirement.** “Catat Suhu Harian” opens `/pemantauan`, which requires authentication. First-time visitors may feel led into a dead end. State the login requirement on the CTA or explain it before opening sign-in. Suggested command: `$impeccable clarify frontend/src/pages/Dashboard.tsx`.
3. **[P1] Five mini-game buttons precede the hero content in keyboard order.** Each mosquito is a “Tepuk nyamuk” button that keyboard users encounter before the health copy and actions. Keep the game but remove it from the tab order before the CTAs, or move its controls after the health actions. Suggested command: `$impeccable polish frontend/src/components/Hero.tsx`.
4. **[P2] Full article bodies make the homepage unnecessarily long.** `Dashboard.tsx` renders each `article.body` paragraph in Bacaan. Show short summaries and a link to the complete education content. Suggested command: `$impeccable distill frontend/src/pages/Dashboard.tsx`.
5. **[P2] Empty or failed content state is silent.** Bacaan is conditionally omitted when no articles are present, so visitors cannot tell an empty list from a loading failure. Show loading, empty, or retry states. Suggested command: `$impeccable harden frontend/src/pages/Dashboard.tsx`.

## Cognitive Load

Moderate; three of eight criteria fail based on source review:
- **Single focus — fail:** the mini-game and counter compete with the health actions in the hero.
- **Chunking — fail:** full article paragraphs extend the Bacaan list.
- **Progressive disclosure — fail:** full article details appear inline instead of as summaries with a next step.

The phase guide is grouped into three cards, the hero offers two main choices, and the primary navigation has four items.

## Persona Red Flags

- **First-time visitor:** choosing temperature tracking triggers a sign-in requirement that the CTA has not disclosed.
- **Keyboard or screen-reader user:** five identical game buttons appear before the hero text and actions.
- **Mobile visitor in an urgent situation:** 119 is not a tap-to-call link.

## Minor Observations

- The phase guide uses day ranges; retain a reminder that timing and recovery vary, as already mentioned in the recovery card.
- The mini-game respects `prefers-reduced-motion`; its position and priority relative to health information still deserve attention.

## Questions to Consider

- Should the homepage primarily lead to screening, calling for help, or browsing education—and can the hero make that priority unmistakable?
- Can the mini-game remain available without entering the keyboard path before the health actions?
- Would short article previews and a single “Lihat semua edukasi” action serve visitors better?
