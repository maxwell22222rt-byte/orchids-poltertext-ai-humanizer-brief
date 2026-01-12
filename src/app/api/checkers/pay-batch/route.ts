import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Batch Payment API for Checkers
 * Automatically pays multiple checkers based on their completed tasks
 * Phone numbers are fetched from accounts in 254 format
 */

interface BatchPaymentRequest {
  checkerIds?: string[]; // Optional: specific checkers, otherwise pay all eligible
  minTasksCompleted?: number; // Minimum tasks to qualify for payment
}

/**
 * POST - Process batch payments to checkers
 * Fetches checkers with completed unpaid tasks and initiates payments
 */
export async function POST(req: NextRequest) {
  try {
    const body: BatchPaymentRequest = await req.json();
    const { checkerIds, minTasksCompleted = 1 } = body;

    // Build query for unpaid tasks
    let query = supabaseAdmin
      .from("checker_tasks")
      .select(`
        checker_id,
        checkers!inner(id, name, email, phone_number, is_active, rate_per_task),
        payment_amount
      `)
      .eq("paid", false)
      .eq("status", "completed");

    // Filter by specific checkers if provided
    if (checkerIds && checkerIds.length > 0) {
      query = query.in("checker_id", checkerIds);
    }

    const { data: unpaidTasks, error: fetchError } = await query;

    if (fetchError) {
      console.error("Failed to fetch unpaid tasks:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch unpaid tasks" },
        { status: 500 }
      );
    }

    if (!unpaidTasks || unpaidTasks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No unpaid tasks found",
        payments: [],
      });
    }

    // Group tasks by checker and calculate totals
    const checkerPayments = new Map<string, {
      checker: any;
      taskCount: number;
      totalAmount: number;
      taskIds: string[];
    }>();

    for (const task of unpaidTasks) {
      const checkerId = task.checker_id;
      const checker = task.checkers;

      if (!checker.is_active) {
        continue; // Skip inactive checkers
      }

      if (!checkerPayments.has(checkerId)) {
        checkerPayments.set(checkerId, {
          checker,
          taskCount: 0,
          totalAmount: 0,
          taskIds: [],
        });
      }

      const payment = checkerPayments.get(checkerId)!;
      payment.taskCount++;
      payment.totalAmount += parseFloat(task.payment_amount);
    }

    // Filter checkers that meet minimum task requirement
    const eligiblePayments = Array.from(checkerPayments.values())
      .filter(p => p.taskCount >= minTasksCompleted);

    if (eligiblePayments.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No checkers have completed minimum ${minTasksCompleted} tasks`,
        payments: [],
      });
    }

    // Process payments
    const paymentResults = [];

    for (const payment of eligiblePayments) {
      const { checker, taskCount, totalAmount } = payment;

      // Validate phone number format (should already be in 254 format)
      if (!checker.phone_number.match(/^254[712]\d{8}$/)) {
        console.error(`Invalid phone format for checker ${checker.id}: ${checker.phone_number}`);
        paymentResults.push({
          checkerId: checker.id,
          checkerName: checker.name,
          status: "failed",
          error: "Invalid phone number format",
        });
        continue;
      }

      try {
        // TODO: Call MPesa B2C API here
        console.log("Processing payment:", {
          checkerId: checker.id,
          checkerName: checker.name,
          phoneNumber: checker.phone_number, // Already in 254 format
          amount: totalAmount,
          tasksCompleted: taskCount,
        });

        // Record payment in database
        const { data: paymentRecord, error: paymentError } = await supabaseAdmin
          .from("checker_payments")
          .insert({
            checker_id: checker.id,
            amount: totalAmount,
            phone_number: checker.phone_number, // Store in 254 format
            reason: `Batch payment for ${taskCount} tasks`,
            tasks_completed: taskCount,
            status: "pending",
            initiated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (paymentError) {
          console.error("Failed to record payment:", paymentError);
          paymentResults.push({
            checkerId: checker.id,
            checkerName: checker.name,
            status: "failed",
            error: "Failed to record payment",
          });
          continue;
        }

        // Mark tasks as paid
        await supabaseAdmin
          .from("checker_tasks")
          .update({
            paid: true,
            payment_id: paymentRecord.id,
          })
          .eq("checker_id", checker.id)
          .eq("paid", false)
          .eq("status", "completed");

        paymentResults.push({
          checkerId: checker.id,
          checkerName: checker.name,
          phoneNumber: checker.phone_number,
          amount: totalAmount,
          tasksCompleted: taskCount,
          paymentId: paymentRecord.id,
          status: "success",
        });
      } catch (error) {
        console.error(`Error processing payment for checker ${checker.id}:`, error);
        paymentResults.push({
          checkerId: checker.id,
          checkerName: checker.name,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = paymentResults.filter(p => p.status === "success").length;
    const failCount = paymentResults.filter(p => p.status === "failed").length;

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount} payments, ${failCount} failed`,
      totalCheckers: eligiblePayments.length,
      successfulPayments: successCount,
      failedPayments: failCount,
      payments: paymentResults,
    });
  } catch (error) {
    console.error("Batch payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Get summary of pending payments
 */
export async function GET(req: NextRequest) {
  try {
    const { data: unpaidTasks, error } = await supabaseAdmin
      .from("checker_tasks")
      .select(`
        checker_id,
        payment_amount,
        checkers!inner(id, name, phone_number, is_active)
      `)
      .eq("paid", false)
      .eq("status", "completed");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch pending payments" },
        { status: 500 }
      );
    }

    // Group by checker
    const summary = new Map<string, {
      checkerId: string;
      checkerName: string;
      phoneNumber: string;
      isActive: boolean;
      taskCount: number;
      totalAmount: number;
    }>();

    for (const task of unpaidTasks || []) {
      const checker = task.checkers;
      const checkerId = checker.id;

      if (!summary.has(checkerId)) {
        summary.set(checkerId, {
          checkerId,
          checkerName: checker.name,
          phoneNumber: checker.phone_number,
          isActive: checker.is_active,
          taskCount: 0,
          totalAmount: 0,
        });
      }

      const checkerSummary = summary.get(checkerId)!;
      checkerSummary.taskCount++;
      checkerSummary.totalAmount += parseFloat(task.payment_amount);
    }

    return NextResponse.json({
      pendingPayments: Array.from(summary.values()),
      totalCheckers: summary.size,
      grandTotal: Array.from(summary.values()).reduce((sum, c) => sum + c.totalAmount, 0),
    });
  } catch (error) {
    console.error("Error fetching payment summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
