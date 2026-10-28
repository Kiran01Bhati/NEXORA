export const paymentMethods = [
  "NEFT",
  "RTGS",
  "UPI",
  "Card",
  "Cheque",
  "Cash",
  "DEMO",
  "Simulated",
] as const;

export type PaymentMethod = (typeof paymentMethods)[number];

export function validatePaymentData(data: any): string[] {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Payment data must be a valid JSON object");
    return errors;
  }

  if (!data.invoiceId) {
    errors.push("invoiceId is required");
  } else if (typeof data.invoiceId !== "string" || data.invoiceId.trim() === "") {
    errors.push("invoiceId must be a non-empty string");
  }

  if (data.amount === undefined || data.amount === null) {
    errors.push("amount is required");
  } else if (typeof data.amount !== "number" || isNaN(data.amount) || !isFinite(data.amount) || data.amount <= 0) {
    errors.push("amount must be a positive number greater than 0");
  }

  if (data.method !== undefined && (typeof data.method !== "string" || data.method.trim() === "")) {
    errors.push("method must be a non-empty string if provided");
  }

  if (data.reference !== undefined && (typeof data.reference !== "string" || data.reference.trim() === "")) {
    errors.push("reference must be a non-empty string if provided");
  }

  if (data.recordedBy !== undefined && (typeof data.recordedBy !== "string" || data.recordedBy.trim() === "")) {
    errors.push("recordedBy must be a non-empty string if provided");
  }

  if (data.date !== undefined && isNaN(Date.parse(data.date))) {
    errors.push("Invalid date format");
  }

  return errors;
}

