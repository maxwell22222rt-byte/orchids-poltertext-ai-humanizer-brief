import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * AUTOMATED CHECKER PAYMENT SYSTEM
 * This endpoint handles automatic payments to content checkers/validators
 * Phone numbers are stored and used in format: 2547XXXXXXXX
 */

/**
 * Format phone number to Kenyan format 2547XXXXXXXX
 * Accepts: 07XXXXXXXX, 7XXXXXXXX, +254XXXXXXXX, 254XXXXXXXX, 2547XXXXXXXX
 */
function formatPhoneNumber(phone: string): string {
  // Remove all spaces, hyphens, and plus signs
  let cleaned = phone.replace(/[\s\-+]/g, "");
  
  // If starts with 0, remove it
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  // If starts with 254 but not 2547, 2541, 2542 (valid prefixes)
  if (cleaned.startsWith("254")) {
    cleaned = cleaned.substring(3);
  }
  
  // Validate that we have a 9-digit number starting with 7, 1, or 2
  if (!/^[712]\d{8}$/.test(cleaned)) {
    throw new Error("Invalid phone number format. Must be a valid Kenyan mobile number.");
  }
  
  // Format as 2547XXXXXXXX
  return `254${cleaned}`;
}

interface CheckerPaymentRequest {
  checkerId: string;
  amount: number;
  reason: string;
  tasksCompleted?: number;
}

/**
 * POST - Pay a specific checker
 * Fetches checker account with phone number in 254 format and initiates payment
 */
export async function POST(req: NextRequest) {
  try {
    const body: CheckerPaymentRequest = await req.json();
    const { checkerId, amount, reason, tasksCompleted } = body;

    // Validate required fields
    if (!checkerId || !amount || !reason) {
      return NextResponse.json(
        { error: "Checker ID, amount, and reason are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Fetch checker account from database
    // Phone number is stored in 254 format
    const { data: checker, error: fetchError } = await supabaseAdmin
      .from("checkers")
      .select("*")
      .eq("id", checkerId)
      .single();

    if (fetchError || !checker) {
      return NextResponse.json(
        { error: "Checker not found" },
        { status: 404 }
      );
    }

    if (!checker.is_active) {
      return NextResponse.json(
        { error: "Checker account is not active" },
        { status: 400 }
      );
    }

    // Phone number is already in 254 format from database
    const phoneNumber = checker.phone_number;

    // Validate phone format (should already be correct, but double-check)
    if (!phoneNumber.match(/^254[712]\d{8}$/)) {
      return NextResponse.json(
        { error: "Invalid phone number format in checker account" },
        { status: 400 }
      );
    }

    // TODO: Integrate with actual MPesa B2C API for automated payments
    // This is where you'd call MPesa B2C (Business to Customer) API
    console.log("Automated checker payment:", {
      checkerId: checker.id,
      checkerName: checker.name,
      phoneNumber: phoneNumber, // Already in 2547XXXXXXXX format
      amount,
      reason,
      tasksCompleted,
    });

    // Record payment in database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("checker_payments")
      .insert({
        checker_id: checkerId,
        amount,
        phone_number: phoneNumber, // Store in 254 format
        reason,
        tasks_completed: tasksCompleted || 0,
        status: "pending",
        initiated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Failed to record payment:", paymentError);
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Checker payment initiated",
      data: {
        paymentId: payment.id,
        checkerId: checker.id,
        checkerName: checker.name,
        phoneNumber: phoneNumber,
        amount,
        reason,
        tasksCompleted: tasksCompleted || 0,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Callback endpoint for MPesa to post payment results
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const paymentId = searchParams.get("paymentId");
  const status = searchParams.get("status");
  const transactionId = searchParams.get("transactionId");

  if (paymentId && status) {
    // Update payment status in database
    await supabaseAdmin
      .from("checker_payments")
      .update({
        status,
        transaction_id: transactionId,
        completed_at: status === "success" ? new Date().toISOString() : null,
      })
      .eq("id", paymentId);
  }

  return NextResponse.json({ message: "MPesa callback received" });
}
