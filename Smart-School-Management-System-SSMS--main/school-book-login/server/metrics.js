// In-memory API metrics + error ring buffer (resets on server restart).
// Good enough for a live ops view; labelled as in-process in the UI.

const HOURS = 24;
const hourlyCalls = new Array(HOURS).fill(0);
const hourlyErrors = new Array(HOURS).fill(0);
let baseHour = currentHour();
const errorLog = []; // most recent first
let totalCalls = 0;

function currentHour() {
  return Math.floor(Date.now() / 3_600_000);
}

function roll() {
  const now = currentHour();
  let shift = now - baseHour;
  if (shift <= 0) return;
  shift = Math.min(shift, HOURS);
  for (let i = 0; i < shift; i++) {
    hourlyCalls.shift(); hourlyCalls.push(0);
    hourlyErrors.shift(); hourlyErrors.push(0);
  }
  baseHour = now;
}

export function recordCall(isError) {
  roll();
  hourlyCalls[HOURS - 1]++;
  totalCalls++;
  if (isError) hourlyErrors[HOURS - 1]++;
}

export function recordError(err, req) {
  errorLog.unshift({
    id: errorLog.length ? errorLog[0].id + 1 : 1,
    message: err.message || String(err),
    stack: err.stack || null,
    method: req?.method,
    path: req?.originalUrl,
    at: new Date().toISOString(),
  });
  if (errorLog.length > 100) errorLog.pop();
}

export function snapshot() {
  roll();
  const labels = [];
  const startHourMs = (baseHour - (HOURS - 1)) * 3_600_000;
  for (let i = 0; i < HOURS; i++) {
    labels.push(new Date(startHourMs + i * 3_600_000).getHours() + ':00');
  }
  const calls = hourlyCalls.reduce((a, b) => a + b, 0);
  const errs = hourlyErrors.reduce((a, b) => a + b, 0);
  return {
    totalCalls,
    last24h: labels.map((label, i) => ({ label, calls: hourlyCalls[i], errors: hourlyErrors[i] })),
    errorRate: calls ? +(errs / calls * 100).toFixed(2) : 0,
    recentErrors: errorLog.slice(0, 25),
  };
}
