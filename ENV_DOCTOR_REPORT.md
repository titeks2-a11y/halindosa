# Environment Doctor Report

This report records non-secret regression checks for the production environment doctor.
It intentionally stores only scenario names and pass/fail outcomes, not environment variable values.

| Scenario | Expected Command Result | Status |
| --- | --- | --- |
| production accepts public https same-origin callback | passes | PASS |
| production rejects localhost site url | fails | PASS |
| production rejects mismatched auth callback origin | fails | PASS |
| production rejects unsafe app scheme | fails | PASS |

Environment doctor tests passed: 4/4
