import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// DELETE /api/orders/delete - Bulk delete orders
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderIds } = body;

    console.log("[Orders Delete] Received delete request for IDs:", orderIds);

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      console.log("[Orders Delete] Invalid or empty orderIds array");
      return NextResponse.json(
        { error: "Please provide an array of order IDs to delete" },
        { status: 400 }
      );
    }

    // Validate all IDs are valid UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const invalidIds = orderIds.filter(id => !uuidRegex.test(id));
    
    if (invalidIds.length > 0) {
      console.log("[Orders Delete] Invalid UUID format for IDs:", invalidIds);
      return NextResponse.json(
        { error: "Invalid order ID format", invalidIds },
        { status: 400 }
      );
    }

    console.log("[Orders Delete] Deleting", orderIds.length, "orders from database...");

    // Delete orders from humanizations table
    const { data, error, count } = await supabaseAdmin
      .from("humanizations")
      .delete()
      .in("id", orderIds)
      .select();

    if (error) {
      console.error("[Orders Delete] Database error:", error);
      throw error;
    }

    console.log("[Orders Delete] Successfully deleted", data?.length || 0, "orders");

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${data?.length || 0} order(s)`,
      deletedCount: data?.length || 0,
      deletedIds: data?.map(d => d.id) || []
    });

  } catch (error) {
    console.error("[Orders Delete] Error:", error);
    return NextResponse.json(
      { error: "Failed to delete orders", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET /api/orders/delete - Not allowed, return method info
export async function GET() {
  return NextResponse.json(
    { 
      error: "Method not allowed", 
      message: "Use DELETE method with { orderIds: string[] } in request body" 
    },
    { status: 405 }
  );
}
