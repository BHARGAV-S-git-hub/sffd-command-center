import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const host = "dbc-c0df26d7-b728.cloud.databricks.com";
    const path = "/sql/1.0/warehouses/f125ebbd74c6efe5";
    const token = "dapi775eabac978712a4e8293d48088e7a80";

    if (!host || !path || !token) {
      console.error("Missing AWS Environment Variables");
      return NextResponse.json({ error: "Missing keys" }, { status: 500 });
    }

    // The path usually looks like /sql/1.0/warehouses/12345abcd
    // We need just the warehouse ID at the very end
    const warehouseId = path.split('/').pop();

    // Format the base URL correctly
    const baseUrl = host.startsWith('http') ? host : `https://${host}`;
    const apiUrl = `${baseUrl}/api/2.0/sql/statements`;

    const query = `
      SELECT * FROM cobratech.default.gold_web_live_engine 
      WHERE latitude IS NOT NULL
    `;

    console.log("Sending query to Databricks REST API...");

    // Send a standard HTTP POST request to Databricks
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        warehouse_id: warehouseId,
        statement: query,
        wait_timeout: "30s" // Wait for the query to finish before returning
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Databricks API Error:", data);
      return NextResponse.json({ error: data.message || "Query failed" }, { status: response.status });
    }

    // Databricks REST API returns data as arrays (columns separate from rows)
    // We need to map it back into an array of objects for your frontend to read
    if (data.status && data.status.state === "SUCCEEDED" && data.result) {
      const columns = data.result.schema.map((col: any) => col.name);
      
      const formattedData = data.result.data_array.map((rowArray: any[]) => {
        let rowObject: any = {};
        rowArray.forEach((value: any, index: number) => {
          // Databricks REST API returns numbers as strings, so we parse them if needed
          rowObject[columns[index]] = isNaN(value as any) ? value : Number(value);
        });
        return rowObject;
      });

      console.log("Success! Data fetched via REST API.");
      return NextResponse.json(formattedData);

    } else {
      console.error("Query didn't succeed immediately:", data);
      return NextResponse.json({ error: "Query pending or failed" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Fetch Crash:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}