export const invoiceStatuses = [
  "Draft",
  "Issued",
  "Partially Paid",
  "Paid",
  "Overdue",
] as const;
export type InvoiceStatus = typeof invoiceStatuses[number];

export function validateInvoiceData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  if (!isUpdate) {
    if (!data.orderId) {
      errors.push("orderId is required");
    }
  }

  if (data.orderId !== undefined && typeof data.orderId !== "string") {
    errors.push("orderId must be a string");
  }

  if (data.status !== undefined && !invoiceStatuses.includes(data.status)) {
    errors.push(`Invalid status. Allowed values: ${invoiceStatuses.join(", ")}`);
  }

  if (data.issuedAt !== undefined && isNaN(Date.parse(data.issuedAt))) {
    errors.push("Invalid issuedAt date");
  }

  if (data.due !== undefined && isNaN(Date.parse(data.due))) {
    errors.push("Invalid due date");
  }

  if (data.notes !== undefined && data.notes !== null && typeof data.notes !== "string") {
    errors.push("notes must be a string");
  }

  return errors;
}
