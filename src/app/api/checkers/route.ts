import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Checker Management API
 * Handles CRUD operations for content checkers
 * Phone numbers are stored in 254 format
 */

/**
 * Format phone number to Kenyan format 2547XXXXXXXX
 */
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-+]/g, "");
  
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.startsWith("254")) {
    cleaned = cleaned.substring(3);
  }
  
  if (!/^[712]\d{8}$/.test(cleaned)) {
    throw new Error("Invalid phone number format. Must be a valid Kenyan mobile number.");
  }
  
  return `254${cleaned}`;
}

/**
 * GET - Fetch all checkers or a specific checker
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const checkerId = searchParams.get("id");

    if (checkerId) {
      // Get specific checker
      const { data: checker, error } = await supabaseAdmin
        .from("checkers")
        .select("*")
        .eq("id", checkerId)
        .single();

      if (error || !checker) {
        return NextResponse.json(
          { error: "Checker not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ checker });
    } else {
      // Get all checkers
      const { data: checkers, error } = await supabaseAdmin
        .from("checkers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json(
          { error: "Failed to fetch checkers" },
          { status: 500 }
        );
      }

      return NextResponse.json({ checkers });
    }
  } catch (error) {
    console.error("Error fetching checkers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new checker
 * Phone number is automatically formatted to 254 format
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phoneNumber, rate_per_task } = body;

    // Validate required fields
    if (!name || !email || !phoneNumber) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required" },
        { status: 400 }
      );
    }

    // Format phone number to 254 format
    let formattedPhone: string;
    try {
      formattedPhone = formatPhoneNumber(phoneNumber);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Invalid phone number" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from("checkers")
      .select("id")
      .eq("email", email)
      .single();

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if phone number already exists
    const { data: existingPhone } = await supabaseAdmin
      .from("checkers")
      .select("id")
      .eq("phone_number", formattedPhone)
      .single();

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 409 }
      );
    }

    // Create checker with phone in 254 format
    const { data: checker, error } = await supabaseAdmin
      .from("checkers")
      .insert({
        name,
        email,
        phone_number: formattedPhone, // Store in 254 format
        rate_per_task: rate_per_task || 10,
        is_active: true,
        total_tasks_completed: 0,
        total_earned: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create checker:", error);
      return NextResponse.json(
        { error: "Failed to create checker" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checker created successfully",
      checker,
    });
  } catch (error) {
    console.error("Error creating checker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update checker details
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, phoneNumber, rate_per_task, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Checker ID is required" },
        { status: 400 }
      );
    }

    const updates: any = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (rate_per_task !== undefined) updates.rate_per_task = rate_per_task;
    if (is_active !== undefined) updates.is_active = is_active;

    // If phone number is being updated, format it
    if (phoneNumber) {
      try {
        updates.phone_number = formatPhoneNumber(phoneNumber);
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : "Invalid phone number" },
          { status: 400 }
        );
      }
    }

    const { data: checker, error } = await supabaseAdmin
      .from("checkers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update checker" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checker updated successfully",
      checker,
    });
  } catch (error) {
    console.error("Error updating checker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a checker
 */
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const checkerId = searchParams.get("id");

    if (!checkerId) {
      return NextResponse.json(
        { error: "Checker ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("checkers")
      .delete()
      .eq("id", checkerId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete checker" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checker deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting checker:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
