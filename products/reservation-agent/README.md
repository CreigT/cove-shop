# Reservation Voice Agent — prototype (not for sale yet)

Sponsored by CREIGNIFICENT LLC.

## What it is
A local restaurant booking demonstration using Python standard library, SQLite, browser speech recognition and speech synthesis. It is NOT an LLM-powered autonomous agent, telephone service, or production booking system.

## Run
Python 3.10+:
```sh
cd products/reservation-agent
python -m unittest -v
python server.py
```
Open http://127.0.0.1:8765 and enter a guest name, party size and future local time.

## Current limits
- Voice transcribes but does not parse booking intent; customer must complete/confirm the form.
- Interrupt stops browser speech output; no streaming barge-in detection.
- Handoff records a request in the browser session only; no human is contacted.
- 90-minute occupancy window; no opening-hours, timezone, cancellation, customer verification, consent or retention policy.
- Local SQLite file, no login, staff administration, audit trail, payment entitlement or multi-tenant isolation.
- Not suitable for public internet deployment. Do not collect real customer data in this demo.

## Before Cove Shop sale
Implement downloadable fulfillment or licensed hosted access, tenant isolation, staff authentication, reservation policy and time zones, privacy controls, genuine human handoff, end-to-end speech booking, deployment and security testing. Run actual checkout and fulfillment verification. Do not list this prototype as a finished AI voice agent.

## Verification
Tests included but must be run independently. No claim of production readiness.
