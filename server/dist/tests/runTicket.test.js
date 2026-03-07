"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const runTicket_1 = require("../api/runTicket");
(0, node_test_1.default)("run ticket can be issued and consumed once", () => {
    const store = new runTicket_1.RunTicketStore();
    const ticket = store.issue("ip-1");
    strict_1.default.ok(ticket.ticketId);
    strict_1.default.equal(store.consume(ticket.ticketId, "ip-1").ok, true);
    strict_1.default.equal(store.consume(ticket.ticketId, "ip-1").ok, false);
});
(0, node_test_1.default)("star count helpers are deterministic", () => {
    strict_1.default.equal((0, runTicket_1.starCountForLevel)(1), 10);
    strict_1.default.equal((0, runTicket_1.starCountForLevel)(30), 24);
    strict_1.default.equal((0, runTicket_1.minimumStarsToReachLevel)(1), 0);
    strict_1.default.ok((0, runTicket_1.minimumStarsToReachLevel)(5) > (0, runTicket_1.minimumStarsToReachLevel)(4));
});
