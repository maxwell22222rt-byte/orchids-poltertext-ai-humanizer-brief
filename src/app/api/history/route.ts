import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "20");

    console.log("[History GET] Fetching history - userId:", userId, "limit:", limit);
    console.log("[History GET] Timestamp:", new Date().toISOString());

    // Fetch history sorted by most recent first
    const { data, error } = await supabaseAdmin
      .from("humanizations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[History GET] Database error:", error);
      throw error;
    }

    console.log("[History GET] Successfully fetched", data?.length || 0, "items");

    // Return response with no-cache headers for real-time data
    const response = NextResponse.json({ 
      history: data,
      timestamp: new Date().toISOString()
    });

    // Force no caching for real-time updates
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    response.headers.set("Surrogate-Control", "no-store");

    return response;
  } catch (error) {
    console.error("[History GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

// DELETE /api/history - Delete history items
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    console.log("[History DELETE] Received delete request for IDs:", ids);

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of IDs to delete" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("humanizations")
      .delete()
      .in("id", ids)
      .select();

    if (error) {
      console.error("[History DELETE] Database error:", error);
      throw error;
    }

    console.log("[History DELETE] Successfully deleted", data?.length || 0, "items");

    return NextResponse.json({
      success: true,
      deletedCount: data?.length || 0
    });
  } catch (error) {
    console.error("[History DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
  }
}
