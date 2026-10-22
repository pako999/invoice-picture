import test from "node:test";
import assert from "node:assert/strict";
import { flowPollDelay } from "../lib/invoice-processing-flow";
test("normal OCR does not accumulate display delay", () => {
  assert.equal(flowPollDelay(0, 0), 2000);
  assert.equal(flowPollDelay(30000, 15), 2000);
  assert.equal(flowPollDelay(89000, 40), 2000);
});
test("long-running jobs retain bounded backoff", () => {
  assert.equal(flowPollDelay(90000, 0), 3000);
  assert.equal(flowPollDelay(120000, 4), 11000);
  assert.equal(flowPollDelay(180000, 90), 15000);
});
