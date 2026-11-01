import assert from 'node:assert/strict';
import { FX_SESSIONS, sessionAt } from '../src/lib/market-sessions';
const session = (name: string) => FX_SESSIONS.find(s => s.name === name)!;
const at = (name: string, timestamp: string) => sessionAt(session(name), new Date(timestamp));
// Local weekday and boundaries, including the different DST transitions across regions.
assert.equal(at('London','2026-01-05T07:59:00Z').active,false);
assert.equal(at('London','2026-01-05T08:00:00Z').active,true);
assert.equal(at('London','2026-01-05T17:00:00Z').active,false);
assert.equal(at('London','2026-07-06T07:00:00Z').active,true);
assert.equal(at('New York','2026-01-05T13:00:00Z').active,true);
assert.equal(at('New York','2026-07-06T12:00:00Z').active,true);
assert.equal(at('Tokyo','2026-01-05T00:00:00Z').active,true);
assert.equal(at('Tokyo','2026-07-06T00:00:00Z').active,true);
assert.equal(at('Sydney','2026-01-04T21:00:00Z').active,true);
assert.equal(at('Sydney','2026-07-05T22:00:00Z').active,true);
assert.equal(at('London','2026-07-04T10:00:00Z').active,false);
assert.equal(at('New York','2026-07-05T13:00:00Z').active,false);
assert.equal(at('Tokyo','2026-01-05T00:00:00Z').time,'09:00');
console.log('PASS: FX session local times, weekday boundaries, differing DST and weekend handling');
