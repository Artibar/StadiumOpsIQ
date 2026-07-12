# Test Suite — StadiumOps IQ

## Running All Tests
Run each test in order:
```bash
node tests/testIntake.js
node tests/testClassification.js
node tests/testContext.js
node tests/testDecision.js
node tests/testReport.js
node tests/testPipeline.js
```

## Test Coverage
| Test | Agent | What it validates |
|------|-------|-------------------|
| testIntake.js | Agent 1 | 5 languages detected + translated |
| testClassification.js | Agent 2 | 6 incident types classified correctly |
| testContext.js | Agent 3 | Live weather + match data fetched |
| testDecision.js | Agent 4 | 4 decision paths + Discord firing |
| testReport.js | Agent 5 | Report generated + email formatted |
| testPipeline.js | All 5 | End-to-end with real incidents |

## Expected Results
- All 5 language tests: PASS
- Critical medical → dispatchMedical: PASS
- Vague incident → flagForHumanReview: PASS
- Real weather data returned: PASS
- Discord notification fired: PASS
- Pipeline fault tolerance: PASS
