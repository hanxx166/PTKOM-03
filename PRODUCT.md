# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The repository describes the intended audience as the Institut Teknologi Sumatera (ITERA) academic community. The primary user and their specific circumstances have not been confirmed with the product owner.

## Product Purpose

The repository describes cekDBD as an educational and self-monitoring portal about dengue fever (DBD). Inferred from the available workflows, it helps users review symptoms, track temperature and platelet results, estimate fluid needs, and learn about prevention and care. The product is not a diagnostic tool and does not replace consultation with a health professional.

## Positioning

No distinct positioning or differentiating mechanism has been confirmed. Do not invent one.

## Operating Context

- The interface and educational content are in Indonesian.
- The frontend is a responsive, single-dashboard web application with additional routes for symptom screening, lab information, temperature tracking, education, and admin content management.
- Temperature and platelet tracking can be stored in the user's browser. Account-backed use and centralized statistics require the backend.
- The repository describes intended use by the ITERA academic community, including monitoring from a dormitory or boarding room; the actual primary use context remains unconfirmed.

## Capabilities and Constraints

- Symptom screening, temperature tracking, a fluid estimate calculator, platelet-result logging, DBD education, prevention checklists, and educational content are present in the frontend.
- Login and centralized user data depend on the Express/Prisma backend and PostgreSQL. Without the backend, the frontend uses bundled static content and browser-local account/data behavior; it does not provide cross-device accounts or statistics.
- Screening and calculator results are for education only. They are not diagnoses or substitutes for professional medical advice.
- No additional accessibility requirement or product-specific standard has been confirmed.

## Brand Commitments

- The existing product name is cekDBD (also rendered as CekDBD in the interface). Treat this as existing repository identity, not as a newly confirmed brand mandate.
- The existing product copy and content are in Indonesian.

## Evidence on Hand

- Product description and technical/operating notes: `README.md`.
- Existing interface, routes, and educational materials: `frontend/src/` and `frontend/public/data/content.json`.
- No verified testimonials, customer claims, outcome metrics, or external endorsements were identified in the repository. Do not fabricate them.

## Product Principles

- Keep educational information distinct from diagnosis or individualized medical advice.
- Make self-monitoring workflows and their limits clear.
- Preserve the Indonesian language used by the current product.
- Do not imply that browser-local records are synchronized across devices.
