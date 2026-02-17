"""Seed the backend with demo meeting data for hackathon demo."""

import httpx
import asyncio
import sys

API_BASE = "http://localhost:8000"

DEMO_MEETINGS = [
    {
        "title": "Product Roadmap Review with Alice",
        "participants": ["Alice Chen", "Bob Smith"],
        "meeting_date": "2026-02-10T10:00:00Z",
        "notes": """Alice: Let's go through the Q1 roadmap. The main priorities are the new search feature and the mobile app launch.

Bob: Agreed. I can take the lead on the search backend. I'll have the API endpoints ready by end of February.

Alice: Great. I'll handle the mobile wireframes and get them reviewed by the design team.

Bob: One thing - we need to decide on the caching strategy. Redis vs Memcached?

Alice: Let's go with Redis, it supports more data structures and we'll need sorted sets for the ranking.

Bob: Makes sense. I'll also need to coordinate with the DevOps team on the Redis cluster setup. Can you introduce me to their lead?

Alice: Sure, I'll send an intro email to Dave by tomorrow.

Bob: Also, the client demo is coming up March 1st. We need to have the search prototype ready by then.

Alice: Absolutely. Let's do a dry run on February 25th. I'll book the conference room.

Bob: Perfect. I'll prepare the demo dataset and make sure the staging environment is stable.""",
    },
    {
        "title": "Sprint Retrospective - Team Alpha",
        "participants": ["Charlie Park", "Diana Ross", "Eve Martinez"],
        "meeting_date": "2026-02-12T14:00:00Z",
        "notes": """Charlie: Let's talk about what went well this sprint and what we can improve.

Diana: The deployment automation saved us a lot of time. Charlie, your CI/CD pipeline improvements were huge.

Eve: Agreed. But we had some issues with the test coverage - two bugs slipped through to production.

Charlie: Right, we need better integration tests. I'll set up a test coverage threshold in the CI pipeline. Let's aim for 80% minimum.

Diana: I can write the missing integration tests for the payment module. That's where both bugs were.

Eve: I'll review them. Also, I want to bring up the documentation issue - our API docs are outdated.

Charlie: Good point. Eve, can you update the API documentation by next Friday? We have new partners onboarding.

Eve: Yes, I'll prioritize that. Diana, can you review my docs when they're ready?

Diana: Of course. I'll also set up automated doc generation from our OpenAPI specs.

Charlie: One more thing - the team morale survey results came in. Overall positive, but people want more pair programming sessions.

Eve: I'll organize weekly pair programming slots starting next Monday. Who wants to volunteer for the first session?

Diana: I'll pair with the new junior developer on the authentication module.""",
    },
    {
        "title": "Investor Update Call with Frank",
        "participants": ["Frank Lee", "Grace Wang"],
        "meeting_date": "2026-02-14T09:00:00Z",
        "notes": """Grace: Frank, thanks for joining. Let me walk you through our January metrics.

Frank: Please go ahead. I'm particularly interested in the user growth numbers.

Grace: We hit 50,000 MAU last month, up 35% from December. The conversion rate from free to paid improved to 4.2%.

Frank: That's solid. What's driving the growth?

Grace: Mostly organic - our content marketing strategy is paying off. We published 12 articles and 3 case studies. The enterprise case study with Acme Corp got a lot of traction.

Frank: Great. What about the enterprise pipeline?

Grace: We have 8 enterprise prospects in the pipeline. Three are in final negotiations. I expect to close at least two by end of Q1.

Frank: Excellent. I'd like to introduce you to a few potential enterprise clients from my network. Can you send me a one-pager on the enterprise offering?

Grace: Absolutely, I'll have that ready by Monday.

Frank: Also, have you thought about the Series B timeline?

Grace: We're planning to start the process in Q2. We want to hit $1M ARR first, which we're on track for by April.

Frank: Good. I'll introduce you to two VCs that would be a good fit. Let me know when you're ready for those conversations.

Grace: Thank you Frank. I'll follow up with the one-pager and a proposed timeline for VC introductions.""",
    },
]


async def seed():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Check health
        try:
            health = await client.get(f"{API_BASE}/health")
            health.raise_for_status()
            print(f"Backend is up: {health.json()}")
        except Exception as e:
            print(f"Backend not reachable at {API_BASE}: {e}")
            print("Start the backend first: cd backend && uvicorn backend.main:app --reload")
            sys.exit(1)

        # Seed meetings
        for meeting in DEMO_MEETINGS:
            print(f"Submitting: {meeting['title']}...")
            resp = await client.post(f"{API_BASE}/api/meetings", json=meeting)
            resp.raise_for_status()
            data = resp.json()
            print(f"  -> meeting_id={data['meeting_id']}, status={data['status']}")

        # Wait for processing
        print("\nWaiting for meeting processing...")
        await asyncio.sleep(5)

        # Verify
        meetings = await client.get(f"{API_BASE}/api/meetings")
        meetings.raise_for_status()
        print(f"\nMeetings: {len(meetings.json())} total")

        commitments = await client.get(f"{API_BASE}/api/commitments")
        commitments.raise_for_status()
        cdata = commitments.json()
        print(f"Commitments: {len(cdata)} extracted")
        for c in cdata:
            print(f"  - [{c['direction']}] {c['description']}")

        print("\nDemo data seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
