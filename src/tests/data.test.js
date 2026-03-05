// src/tests/data.test.js
// Unit tests for shared/data.js — receipt code generation and vote init helpers.

import { describe, it, expect } from "vitest";
import { generateReceiptCode, initDraftVotes, INITIAL_ELECTIONS } from "../shared/data.js";

describe("generateReceiptCode", () => {
  it("returns a string of length 19 (16 chars + 3 dashes)", () => {
    const code = generateReceiptCode();
    expect(code).toHaveLength(19);
  });

  it("follows the XXXX-XXXX-XXXX-XXXX pattern", () => {
    const code = generateReceiptCode();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("generates unique codes on each call", () => {
    const codes = new Set(Array.from({ length: 100 }, generateReceiptCode));
    expect(codes.size).toBe(100);
  });

  it("never contains ambiguous characters 0, O, 1, or I", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReceiptCode().replace(/-/g, "");
      expect(code).not.toMatch(/[01OI]/);
    }
  });
});

describe("initDraftVotes", () => {
  it("returns an object with a key for every ballot ID", () => {
    const votes = initDraftVotes(INITIAL_ELECTIONS);
    const allBallotIds = INITIAL_ELECTIONS.flatMap(e => e.ballots.map(b => b.id));
    allBallotIds.forEach(id => {
      expect(votes).toHaveProperty(id);
      expect(votes[id]).toBeNull();
    });
  });

  it("returns empty object for empty election list", () => {
    expect(initDraftVotes([])).toEqual({});
  });
});

describe("INITIAL_ELECTIONS seed data", () => {
  it("contains at least 3 elections", () => {
    expect(INITIAL_ELECTIONS.length).toBeGreaterThanOrEqual(3);
  });

  it("every election has required fields", () => {
    INITIAL_ELECTIONS.forEach(el => {
      expect(el).toHaveProperty("id");
      expect(el).toHaveProperty("title");
      expect(el).toHaveProperty("type");
      expect(el).toHaveProperty("date");
      expect(el).toHaveProperty("status");
      expect(el).toHaveProperty("ballots");
      expect(Array.isArray(el.ballots)).toBe(true);
    });
  });

  it("every ballot has at least 2 candidates", () => {
    INITIAL_ELECTIONS.forEach(el => {
      el.ballots.forEach(ballot => {
        expect(ballot.candidates.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it("contains one closed election with vote data", () => {
    const closed = INITIAL_ELECTIONS.filter(e => e.status === "closed");
    expect(closed.length).toBeGreaterThanOrEqual(1);
    expect(closed[0].votes_cast).toBeGreaterThan(0);
  });
});
