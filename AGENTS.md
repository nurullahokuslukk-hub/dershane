# Development rules
Read README and docs/architecture.md. No real student data/secrets in source/tests.
Never accept tenant/role/category from client as authority. Keep role+assignment+consent checks.
No covert collection; messages/files/location are out of scope. Never call limited usage exact screen time.
Run node --test tests/*.test.ts before merge. Negative tests for access changes are required.
Do not label this local adapter or unverified device behavior production-ready. No automatic production deployment.
