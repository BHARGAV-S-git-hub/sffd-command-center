import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // HARDCODED CREDENTIALS FOR STABILITY DURING REVIEW
    const host = "dbc-c0df26d7-b728.cloud.databricks.com";
    const path = "/sql/1.0/warehouses/f125ebbd74c6efe5";
    const token = "dapi775eabac978712a4e8293d48088e7a80";

    const warehouseId = path.split('/').pop();
    const baseUrl = host.startsWith('http') ? host : `https://${host}`;
    const apiUrl = `${baseUrl}/api/2.0/sql/statements`;

    const query = `
      SELECT * FROM cobratech.default.gold_web_live_engine 
      WHERE latitude IS NOT NULL
    `;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        warehouse_id: warehouseId,
        statement: query,
        wait_timeout: "30s",
        on_wait_timeout: "CONTINUE"
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Databricks API Error:", data);
      return NextResponse.json({ error: data.message || "Query failed" }, { status: response.status });
    }

    // CHECK FOR SUCCESSFUL EXECUTION
    if (data.status && data.status.state === "SUCCEEDED") {
      
      // 1. Get Column Names (Correct path for REST API v2.0)
      const columns = data.manifest.schema.columns.map((col: any) => col.name);
      
      // 2. Get the Rows (Fallback through all possible Databricks result formats)
      const rows = data.result?.data_typed_array || data.result?.data_array || [];

      if (rows.length === 0) {
        return NextResponse.json({ error: "Table is empty" }, { status: 404 });
      }

      // 3. Map into the object format Bhargav's map expects
      const formattedData = rows.map((rowArray: any[]) => {
        let rowObject: any = {};
        rowArray.forEach((value: any, index: number) => {
          // Convert strings to numbers where applicable
          rowObject[columns[index]] = (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== "") 
            ? Number(value) 
            : value;
        });
        return rowObject;
      });

      return NextResponse.json(formattedData);

    } else if (data.status && (data.status.state === "PENDING" || data.status.state === "RUNNING")) {
      // If the query takes a few seconds, tell the frontend to try again
      return NextResponse.json({ error: "Warm-up in progress. Refresh in 5 seconds." }, { status: 202 });
    } else {
      return NextResponse.json({ error: "Query failed to execute" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Critical Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}