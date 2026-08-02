#!/usr/bin/env node

/**
 * Seed script: creates the owner admin account.
 *
 * Usage:
 *   npm run db:seed
 *   OWNER_PASSWORD="new-password" npm run db:seed -- --update-password
 *
 * Requires DATABASE_URL, OWNER_EMAIL, and OWNER_PASSWORD in .env.
 * Does NOT overwrite an existing owner password unless --update-password is passed.
 */

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
const ownerPassword = process.env.OWNER_PASSWORD;
const updatePassword = process.argv.includes("--update-password");

if (!databaseUrl) {
  console.error("Error: DATABASE_URL is not set.");
  process.exit(1);
}
if (!ownerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
  console.error("Error: OWNER_EMAIL is not set or invalid.");
  process.exit(1);
}
if (!ownerPassword) {
  console.error("Error: OWNER_PASSWORD is not set.");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  const existing = await sql`SELECT id, email FROM admin_users WHERE email = ${ownerEmail} LIMIT 1`;

  if (existing.length > 0) {
    if (!updatePassword) {
      console.log(`Owner account ${ownerEmail} already exists. Password unchanged.`);
      console.log("To update the password, re-run with: npm run db:seed -- --update-password");
    } else {
      const passwordHash = await bcrypt.hash(ownerPassword, 12);
      await sql`UPDATE admin_users SET password_hash = ${passwordHash}, role = 'owner', active = true, name = 'Owner', updated_at = NOW() WHERE email = ${ownerEmail}`;
      console.log(`Updated owner account password: ${ownerEmail}`);
    }
  } else {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    await sql`INSERT INTO admin_users (email, password_hash, name, role, active) VALUES (${ownerEmail}, ${passwordHash}, 'Owner', 'owner', true)`;
    console.log(`Created owner account: ${ownerEmail}`);
  }

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
