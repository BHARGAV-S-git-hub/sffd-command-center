import { NextResponse } from 'next/server';
import { DBSQLClient } from '@databricks/sql';

export async function GET() {
  // 1. Strict Environment Variable Check - UPDATED TO MATCH YOUR .ENV
  const host = process.env.DATABRICKS_SERVER_HOSTNAME; 
  const path = process.env.DATABRICKS_HTTP_PATH;
  const token = process.env.DATABRICKS_TOKEN;

  if (!host || !path || !token) {
    console.error("Missing Databricks configuration. Check .env.local");
    return NextResponse.json(
      { error: "Server configuration error." }, 
      { status: 500 }
    );
  }

  const client = new DBSQLClient();

  try {
    // 2. Connect using the validated credentials
    await client.connect({
      host: host,
      path: path,
      token: token,
    });

    const session = await client.openSession();

    // The Golden Query: Now pulling from Akash's ML Engine
    const query = `
      SELECT * FROM cobratech.default.gold_web_live_engine 
      WHERE latitude IS NOT NULL
    `;

    const queryOperation = await session.executeStatement(query);
    const result = await queryOperation.fetchAll();

    await session.close();
    await client.close();

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error("Databricks Connection FAILED:", error);
    return NextResponse.json(
      { error: "Failed to fetch live data from Databricks." }, 
      { status: 500 }
    );
  }
}