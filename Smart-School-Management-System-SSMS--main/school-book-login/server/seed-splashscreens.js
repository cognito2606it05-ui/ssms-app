import fs from 'fs';
import path from 'path';
import { pool } from './db.js';

const __dirname = path.resolve();

async function seedSplashscreens() {
  console.log('Starting splashscreen database seeding...');
  const client = await pool.connect();
  try {
    // 1. Drop existing table to avoid catalog sequence issues
    await client.query(`DROP TABLE IF EXISTS portal_splashscreens CASCADE;`);
    console.log('Old table dropped.');

    // 2. Create table
    await client.query(`
      CREATE TABLE portal_splashscreens (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        mime_type VARCHAR(50) NOT NULL,
        data BYTEA NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table portal_splashscreens verified.');

    // 3. Load and insert stu_success.mp4
    const successPath = path.join(__dirname, 'Splashscreens', 'stu_success.mp4');
    if (fs.existsSync(successPath)) {
      const successData = fs.readFileSync(successPath);
      await client.query(`
        INSERT INTO portal_splashscreens (name, mime_type, data)
        VALUES ('stu_success', 'video/mp4', $1)
        ON CONFLICT (name) DO UPDATE SET
          mime_type = EXCLUDED.mime_type,
          data = EXCLUDED.data,
          created_at = now()
      `, [successData]);
      console.log('stu_success.mp4 uploaded to database.');
    } else {
      console.warn(`File not found: ${successPath}`);
    }

    // 4. Load and insert stu_error.mp4
    const errorPath = path.join(__dirname, 'Splashscreens', 'stu_error.mp4');
    if (fs.existsSync(errorPath)) {
      const errorData = fs.readFileSync(errorPath);
      await client.query(`
        INSERT INTO portal_splashscreens (name, mime_type, data)
        VALUES ('stu_error', 'video/mp4', $1)
        ON CONFLICT (name) DO UPDATE SET
          mime_type = EXCLUDED.mime_type,
          data = EXCLUDED.data,
          created_at = now()
      `, [errorData]);
      console.log('stu_error.mp4 uploaded to database.');
    } else {
      console.warn(`File not found: ${errorPath}`);
    }

  } catch (err) {
    console.error('Error seeding splashscreens:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedSplashscreens();
