"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { formatKenyanPhoneNumber, isValidKenyanPhone, initiatePayment } from "@/lib/mpesa";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  planName: string;
}

export function PaymentModal({ isOpen, onClose, amount, planName }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState("");

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value);
    setError("");
    
    // Try to format and show preview
    try {
      if (value.length >= 9) {
        const formatted = formatKenyanPhoneNumber(value);
        setFormattedPhone(formatted);
      } else {
        setFormattedPhone("");
      }
    } catch {
      setFormattedPhone("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validate phone number
    if (!isValidKenyanPhone(phoneNumber)) {
      setError("Please enter a valid Kenyan phone number (e.g., 0712345678)");
      return;
    }

    setIsLoading(true);

    try {
      const result = await initiatePayment({
        phoneNumber,
        amount,
        accountReference: planName,
        transactionDesc: `${planName} Plan Subscription`,
      });

      if (result.success) {
        setSuccess(true);
        setFormattedPhone(result.data?.phoneNumber || "");
        setTimeout(() => {
          onClose();
          resetForm();
        }, 3000);
      } else {
        setError(result.error || "Payment initiation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setError("");
    setSuccess(false);
    setFormattedPhone("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Complete Payment
          </DialogTitle>
          <DialogDescription>
            Pay KES {amount.toLocaleString()} for {planName} plan via M-Pesa
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8">
            <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Payment request sent to {formattedPhone}. Please check your phone and enter your M-Pesa PIN.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  disabled={isLoading}
                  className="text-base"
                />
                {formattedPhone && (
                  <p className="text-xs text-muted-foreground">
                    Will be sent to: {formattedPhone}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Enter your Safaricom, Airtel, or Telkom number
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !phoneNumber}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay KES {amount.toLocaleString()}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
