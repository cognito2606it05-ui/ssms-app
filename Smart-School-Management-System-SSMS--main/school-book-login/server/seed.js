import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool, q } from './db.js';
import { hashPassword } from './auth.js';
import { MODULES, ROLES, PROFILES, DEMO_USERS, DEMO_PASSWORD, flagsToPerm } from './rbac-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  console.log('› Connecting to Postgres…');
  await q('SELECT 1');

  console.log('› Applying schema…');
  await q(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));

  console.log('› Resetting RBAC tables…');
  await q('TRUNCATE role_permissions, user_roles, users, roles, modules RESTART IDENTITY CASCADE');

  console.log('› Seeding modules…');
  for (const m of MODULES) {
    await q('INSERT INTO modules (key, name, sort) VALUES ($1,$2,$3)', [m.key, m.name, m.sort]);
  }

  console.log('› Seeding roles…');
  for (const r of ROLES) {
    await q(
      `INSERT INTO roles (key, name, level, access_pct, tier, is_custom, description)
       VALUES ($1,$2,$3,$4,$5,FALSE,$6)`,
      [r.key, r.name, r.level, r.access_pct, r.tier, r.description],
    );
  }

  console.log('› Seeding permission matrix…');
  for (const [roleKey, modules] of Object.entries(PROFILES)) {
    for (const [moduleKey, flags] of Object.entries(modules)) {
      const p = flagsToPerm(flags);
      await q(
        `INSERT INTO role_permissions
           (role_key, module_key, can_read, can_write, can_edit, can_delete, can_approve, can_export)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [roleKey, moduleKey, p.can_read, p.can_write, p.can_edit, p.can_delete, p.can_approve, p.can_export],
      );
    }
  }

  console.log('› Seeding demo users…');
  const pwHash = hashPassword(DEMO_PASSWORD);
  for (const u of DEMO_USERS) {
    const { rows } = await q(
      'INSERT INTO users (email, password_hash, name, primary_role) VALUES ($1,$2,$3,$4) RETURNING id',
      [u.email, pwHash, u.name, u.primary_role],
    );
    const userId = rows[0].id;
    for (const role of u.roles) {
      await q('INSERT INTO user_roles (user_id, role_key) VALUES ($1,$2)', [userId, role]);
    }
  }

  const counts = await q(`
    SELECT
      (SELECT count(*) FROM roles) AS roles,
      (SELECT count(*) FROM modules) AS modules,
      (SELECT count(*) FROM role_permissions) AS perms,
      (SELECT count(*) FROM users) AS users
  `);
  console.log('✓ Seed complete:', counts.rows[0]);
  console.log(`  Demo login password for every user: ${DEMO_PASSWORD}`);
  console.log('  e.g. super_admin@ssms.local, teacher@ssms.local, multi@ssms.local');
  await pool.end();
}

main().catch((e) => {
  console.error('✗ Seed failed:', e);
  process.exit(1);
});
