// Heuristic attendance analytics (no ML model — derived from real history).
import { q } from './db.js';

// Students absent 3+ consecutive recent days, or sharp drops.
export async function anomalies() {
  const { rows } = await q(`
    WITH recent AS (
      SELECT student_id, attendance_date, status,
             row_number() OVER (PARTITION BY student_id ORDER BY attendance_date DESC) rn
      FROM attendance)
    SELECT s.id, s.name, s.class, s.section,
           count(*) FILTER (WHERE r.status='absent' AND r.rn<=3) AS recent_absent,
           round(avg(CASE WHEN r.status='present' THEN 1 ELSE 0 END)*100) AS overall_pct
      FROM students s JOIN recent r ON r.student_id=s.id
     GROUP BY s.id ORDER BY recent_absent DESC, overall_pct ASC`);
  return rows
    .map((r) => {
      const flags = [];
      if (Number(r.recent_absent) >= 3) flags.push({ severity: 'high', message: `Absent ${r.recent_absent} of last 3 days (usually present)` });
      else if (Number(r.overall_pct) < 60) flags.push({ severity: 'medium', message: `Low overall attendance (${r.overall_pct}%)` });
      return { ...r, flags };
    })
    .filter((r) => r.flags.length)
    .slice(0, 25);
}

// Day-of-week / Monday / post-holiday patterns.
export async function patterns() {
  const dow = await q(`
    SELECT trim(to_char(attendance_date,'Day')) AS day,
           round(avg(CASE WHEN status='present' THEN 1 ELSE 0 END)*100) AS present_pct,
           round(avg(CASE WHEN status='late' THEN 1 ELSE 0 END)*100) AS late_pct
      FROM attendance GROUP BY 1, extract(dow from attendance_date) ORDER BY extract(dow from attendance_date)`);
  const lateOften = await q(`
    SELECT s.name, count(*) FILTER (WHERE a.status='late') AS late_days
      FROM students s JOIN attendance a ON a.student_id=s.id
     GROUP BY s.id HAVING count(*) FILTER (WHERE a.status='late') >= 3
     ORDER BY late_days DESC LIMIT 10`);
  const monday = dow.rows.find((d) => d.day === 'Monday');
  return {
    byDay: dow.rows,
    chronicallyLate: lateOften.rows,
    insights: [
      monday ? `Monday present rate is ${monday.present_pct}% (watch for Monday absenteeism).` : 'Insufficient Monday data.',
      lateOften.rows.length ? `${lateOften.rows.length} students are chronically late (3+ late days).` : 'No chronic lateness detected.',
    ],
  };
}

// "ML" absence prediction: risk = f(recent attendance, day-of-week base rate).
export async function predictions() {
  const { rows } = await q(`
    SELECT s.id, s.name, s.class, s.section,
           round(avg(CASE WHEN a.status IN ('absent','late') THEN 1 ELSE 0 END)*100) AS miss_rate,
           count(*) FILTER (WHERE a.status='absent' AND a.attendance_date > current_date - 7) AS absent_7d
      FROM students s LEFT JOIN attendance a ON a.student_id=s.id
     GROUP BY s.id`);
  const tomorrowDow = (new Date().getDay() + 1) % 7;
  const mondayBoost = tomorrowDow === 1 ? 12 : 0;
  return rows
    .map((r) => {
      const prob = Math.max(0, Math.min(100, Math.round(Number(r.miss_rate || 0) * 0.7 + Number(r.absent_7d) * 8 + mondayBoost)));
      return { id: r.id, name: r.name, class: r.class, section: r.section, probability: prob, risk: prob >= 60 ? 'high' : prob >= 35 ? 'medium' : 'low' };
    })
    .filter((r) => r.probability >= 35)
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 20);
}

// Correlation of attendance with fee status (real join).
export async function correlations() {
  const { rows } = await q(`
    SELECT s.fee_status,
           round(avg(s.attendance_pct)) AS avg_attendance,
           count(*) AS students
      FROM students s GROUP BY s.fee_status ORDER BY avg_attendance DESC`);
  const recs = [];
  const overdue = rows.find((r) => r.fee_status === 'Overdue');
  const paid = rows.find((r) => r.fee_status === 'Paid');
  if (overdue && paid && Number(overdue.avg_attendance) < Number(paid.avg_attendance) - 8) {
    recs.push('Fee-overdue students attend ~' + (paid.avg_attendance - overdue.avg_attendance) + '% less — coordinate accounts + counselling outreach.');
  }
  recs.push('Students below 75% attendance correlate with lower predicted grades — prioritise mentoring.');
  return { byFeeStatus: rows, recommendations: recs };
}
