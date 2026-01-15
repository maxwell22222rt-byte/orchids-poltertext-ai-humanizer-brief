import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/orders - Fetch all orders with no caching
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log("[Orders GET] Fetching orders - userId:", userId, "limit:", limit, "offset:", offset);
    console.log("[Orders GET] Timestamp:", new Date().toISOString());

    // Build query - fetch from humanizations table, sorted by most recent first
    let query = supabaseAdmin
      .from("humanizations")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // If userId provided, filter by user
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[Orders GET] Database error:", error);
      throw error;
    }

    console.log("[Orders GET] Successfully fetched", data?.length || 0, "orders. Total count:", count);

    // Return response with no-cache headers for real-time data
    const response = NextResponse.json({
      success: true,
      orders: data || [],
      total: count || 0,
      limit,
      offset,
      timestamp: new Date().toISOString()
    });

    // Force no caching for real-time updates
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;

  } catch (error) {
    console.error("[Orders GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
