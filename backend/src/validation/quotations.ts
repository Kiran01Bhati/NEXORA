export const quotationStatuses = ["Draft", "Sent", "Accepted", "Rejected", "Expired"] as const;
export type QuotationStatus = typeof quotationStatuses[number];

export function validateQuotationData(data: any, isUpdate = false) {
  const errors: string[] = [];

  // For creation, we might require some fields. For update, everything is optional.
  if (!isUpdate) {
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      errors.push("quotation items are required and must be an array");
    }
  }

  if (data.leadId && typeof data.leadId !== "string") {
    errors.push("leadId must be a string");
  }

  if (data.opportunityId && typeof data.opportunityId !== "string") {
    errors.push("opportunityId must be a string");
  }

  if (data.items && Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item at index ${index} must have a quantity > 0`);
      }
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        errors.push(`Item at index ${index} must have a unitPrice >= 0`);
      }
      if (item.productId && typeof item.productId !== "string") {
        errors.push(`Item at index ${index} must have a valid productId`);
      }
    });
  }

  if (data.discount !== undefined && data.discount < 0) {
    errors.push("discount cannot be negative");
  }

  if (data.tax !== undefined && data.tax < 0) {
    errors.push("tax cannot be negative");
  }

  if (data.status && !quotationStatuses.includes(data.status)) {
    errors.push("Invalid status");
  }

  if (data.date && isNaN(Date.parse(data.date))) {
    errors.push("Invalid date");
  }

  if (data.validUntil && isNaN(Date.parse(data.validUntil))) {
    errors.push("Invalid validUntil date");
  }

  return errors;
}
