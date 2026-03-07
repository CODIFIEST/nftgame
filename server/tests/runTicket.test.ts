import test from "node:test";
import assert from "node:assert/strict";
import { minimumStarsToReachLevel, RunTicketStore, starCountForLevel } from "../api/runTicket";

test("run ticket can be issued and consumed once", () => {
    const store = new RunTicketStore();
    const ticket = store.issue("ip-1");
    assert.ok(ticket.ticketId);
    assert.equal(store.consume(ticket.ticketId, "ip-1").ok, true);
    assert.equal(store.consume(ticket.ticketId, "ip-1").ok, false);
});

test("star count helpers are deterministic", () => {
    assert.equal(starCountForLevel(1), 10);
    assert.equal(starCountForLevel(30), 24);
    assert.equal(minimumStarsToReachLevel(1), 0);
    assert.ok(minimumStarsToReachLevel(5) > minimumStarsToReachLevel(4));
});
