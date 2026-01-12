/**
 * MPesa Integration Utilities
 * Handles phone number formatting and payment requests
 */

/**
 * Format phone number to Kenyan format 2547XXXXXXXX
 * Accepts various formats:
 * - 07XXXXXXXX -> 2547XXXXXXXX
 * - 7XXXXXXXX -> 2547XXXXXXXX
 * - +254XXXXXXXX -> 254XXXXXXXX
 * - 254XXXXXXXX -> 254XXXXXXXX
 * - 2547XXXXXXXX -> 2547XXXXXXXX
 */
export function formatKenyanPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[\s\-()]/g, "");
  
  // Remove leading + if present
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }
  
  // If starts with 0, remove it (local format 07XX -> 7XX)
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  
  // If already starts with 254, remove it to normalize
  if (cleaned.startsWith("254")) {
    cleaned = cleaned.substring(3);
  }
  
  // Validate that we have a 9-digit number starting with 7, 1, or 2
  // 7XX - Safaricom
  // 1XX - Airtel
  // 2XX - Orange (now Telkom)
  if (!/^[712]\d{8}$/.test(cleaned)) {
    throw new Error(
      "Invalid Kenyan phone number. Must start with 7, 1, or 2 and be 9 digits long."
    );
  }
  
  // Return formatted as 2547XXXXXXXX (or 2541X, 2542X)
  return `254${cleaned}`;
}

/**
 * Validate if a phone number is a valid Kenyan format
 */
export function isValidKenyanPhone(phone: string): boolean {
  try {
    formatKenyanPhoneNumber(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get phone provider based on prefix
 */
export function getPhoneProvider(phone: string): string {
  const formatted = formatKenyanPhoneNumber(phone);
  const prefix = formatted.substring(3, 4); // Get the first digit after 254
  
  switch (prefix) {
    case "7":
      return "Safaricom";
    case "1":
      return "Airtel";
    case "2":
      return "Telkom";
    default:
      return "Unknown";
  }
}

interface MPesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
}

interface MPesaPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    phoneNumber: string;
    amount: number;
    accountReference: string;
    transactionDesc: string;
    checkoutRequestID?: string;
    merchantRequestID?: string;
  };
  error?: string;
}

/**
 * Initiate MPesa STK Push payment
 */
export async function initiatePayment(
  request: MPesaPaymentRequest
): Promise<MPesaPaymentResponse> {
  try {
    // Format phone number
    const formattedPhone = formatKenyanPhoneNumber(request.phoneNumber);
    
    const response = await fetch("/api/payment/mpesa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber: formattedPhone,
        amount: request.amount,
        accountReference: request.accountReference || "PolterText",
        transactionDesc: request.transactionDesc || "PolterText Payment",
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Payment initiation failed");
    }
    
    return data;
  } catch (error) {
    return {
      success: false,
      message: "Payment initiation failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check payment status
 */
export async function checkPaymentStatus(
  checkoutRequestID: string
): Promise<{ status: string; resultCode?: string; resultDesc?: string }> {
  try {
    const response = await fetch(
      `/api/payment/mpesa/status?checkoutRequestID=${checkoutRequestID}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      status: "error",
      resultDesc: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
