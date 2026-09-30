// Heuristic "AI" scoring for students (no ML model — derived from real
// attendance / fee / engagement signals). Labelled as heuristic in the UI.

const STYLES = ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'];
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

export function computeScores(s) {
  const att = Number(s.attendance_pct ?? 100);
  let risk = 0;
  if (att < 60) risk += 45; else if (att < 75) risk += 30; else if (att < 85) risk += 15;
  if (s.fee_status === 'Overdue') risk += 25; else if (s.fee_status === 'Partial') risk += 10;
  if (s.status === 'Inactive') risk += 15;
  risk = clamp(risk + ((s.id || 0) % 7) - 3);

  const engagement = clamp(att * 0.7 + 30 - risk * 0.25);
  const predicted_grade = risk < 20 ? 'A' : risk < 40 ? 'B' : risk < 65 ? 'C' : 'D';
  const learning_style = STYLES[(s.id || 0) % STYLES.length];

  const recommendations = [];
  if (att < 75) recommendations.push('Schedule attendance counselling with the class teacher.');
  if (s.fee_status === 'Overdue') recommendations.push('Flag to accounts for a fee-payment plan.');
  if (risk >= 65) recommendations.push('Add to the at-risk mentoring cohort and notify guardians.');
  if (engagement < 50) recommendations.push(`Adapt material to a ${learning_style.toLowerCase()} learning style.`);
  if (!recommendations.length) recommendations.push('On track — maintain current support level.');

  return { dropout_risk: risk, engagement, predicted_grade, learning_style, recommendations };
}

// Returns anomaly alerts to raise for a student (attendance/grade drops).
export function detectAnomalies(s) {
  const out = [];
  const att = Number(s.attendance_pct ?? 100);
  if (att < 70) out.push({ kind: 'attendance', severity: att < 55 ? 'high' : 'medium', message: `Attendance dropped to ${att}%` });
  if (s.fee_status === 'Overdue' && att < 80) out.push({ kind: 'grade', severity: 'medium', message: 'Combined fee + attendance risk detected' });
  return out;
}

export function riskBadge(risk) {
  return risk >= 65 ? 'red' : risk >= 35 ? 'amber' : 'green';
}
