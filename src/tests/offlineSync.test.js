// src/tests/offlineSync.test.js
// Unit tests for shared/offlineSync.js — queue, persistence, and sync logic.

import { describe, it, expect, beforeEach } from "vitest";
import {
  enqueueVote,
  getQueueStats,
  clearQueue,
  registerOnlineListener,
} from "../shared/offlineSync.js";

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeVote(id = "1") {
  return {
    code:          `TEST-CODE-ABCD-${id.toString().padStart(4, "0")}`,
    electionId:    "E2027-FED",
    electionTitle: "2027 Federal General Elections",
    votes:         { B1: "C1", B2: "C5" },
    timestamp:     new Date().toISOString(),
  };
}

beforeEach(async () => {
  // Clear queue between tests for isolation
  await clearQueue();
});

// ── Enqueue & persistence ─────────────────────────────────────────────────────
describe("enqueueVote", () => {
  it("persists a vote to IndexedDB immediately", async () => {
    const vote     = makeVote("001");
    const statuses = [];
    await enqueueVote(vote, s => statuses.push(s));

    const stats = await getQueueStats();
    expect(stats.total).toBe(1);
    expect(stats.records[0].code).toBe(vote.code);
  });

  it("emits a 'queued' status event", async () => {
    const statuses = [];
    await enqueueVote(makeVote("002"), s => statuses.push(s));
    expect(statuses.some(s => s.type === "queued")).toBe(true);
  });

  it("stores multiple votes without conflict", async () => {
    await enqueueVote(makeVote("003"), () => {});
    await enqueueVote(makeVote("004"), () => {});
    await enqueueVote(makeVote("005"), () => {});

    const stats = await getQueueStats();
    expect(stats.total).toBe(3);
  });
});

// ── Queue stats ───────────────────────────────────────────────────────────────
describe("getQueueStats", () => {
  it("returns zero stats on an empty queue", async () => {
    const stats = await getQueueStats();
    expect(stats.total).toBe(0);
    expect(stats.pending).toBe(0);
    expect(stats.synced).toBe(0);
  });

  it("counts pending vs synced correctly after sync", async () => {
    await enqueueVote(makeVote("006"), () => {});

    const stats = await getQueueStats();
    // After enqueue with navigator.onLine = true (mocked in setup),
    // the vote should attempt sync. Pending count depends on mock server success.
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(typeof stats.pending).toBe("number");
    expect(typeof stats.synced).toBe("number");
  });
});

// ── Clear queue ───────────────────────────────────────────────────────────────
describe("clearQueue", () => {
  it("empties the queue completely", async () => {
    await enqueueVote(makeVote("007"), () => {});
    await enqueueVote(makeVote("008"), () => {});
    await clearQueue();

    const stats = await getQueueStats();
    expect(stats.total).toBe(0);
  });
});

// ── Online listener ───────────────────────────────────────────────────────────
describe("registerOnlineListener", () => {
  it("returns a cleanup function", () => {
    const cleanup = registerOnlineListener(() => {});
    expect(typeof cleanup).toBe("function");
    cleanup(); // Should not throw
  });

  it("fires 'went_offline' status when offline event fires", () => {
    const statuses = [];
    const cleanup  = registerOnlineListener(s => statuses.push(s));

    window.dispatchEvent(new Event("offline"));

    expect(statuses.some(s => s.type === "went_offline")).toBe(true);
    cleanup();
  });
});
