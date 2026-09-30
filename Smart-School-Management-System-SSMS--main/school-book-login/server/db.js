import pg from 'pg';

// Connection settings (env-overridable; defaults match the provided dev DB).
export const pool = new pg.Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Cognito@2025',
  database: process.env.PGDATABASE || 'ssms',
  max: 10,
});

export const q = (text, params) => pool.query(text, params);
