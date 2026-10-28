export const orderRiskLevels = ["None", "Low", "Medium", "High", "Critical"] as const;
export type OrderRiskLevel = typeof orderRiskLevels[number];

export const orderApprovalStatuses = [
  "Not Required",
  "Pending",
  "Approved",
  "Rejected",
  "Changes Requested",
] as const;
export type OrderApprovalStatus = typeof orderApprovalStatuses[number];

export const orderInventoryStatuses = [
  "Not Reserved",
  "Reserved",
  "Backordered",
  "Fulfilled",
] as const;
export type OrderInventoryStatus = typeof orderInventoryStatuses[number];

export const orderPaymentStatuses = [
  "Not Invoiced",
  "Unpaid",
  "Partial",
  "Paid",
] as const;
export type OrderPaymentStatus = typeof orderPaymentStatuses[number];

export function validateSalesOrderData(data: any, isUpdate = false): string[] {
  const errors: string[] = [];

  if (!isUpdate) {
    // For creation: must have either quotationId or customerId + lines
    if (!data.quotationId && !data.customerId) {
      errors.push("Either quotationId or customerId is required");
    }
    if (!data.quotationId && (!data.lines || !Array.isArray(data.lines) || data.lines.length === 0)) {
      errors.push("lines are required when quotationId is not provided");
    }
    if (!data.quotationId && !data.createdBy) {
      errors.push("createdBy is required when quotationId is not provided");
    }
  }

  if (data.quotationId !== undefined && typeof data.quotationId !== "string") {
    errors.push("quotationId must be a string");
  }

  if (data.customerId !== undefined && typeof data.customerId !== "string") {
    errors.push("customerId must be a string");
  }

  if (data.opportunityId !== undefined && typeof data.opportunityId !== "string") {
    errors.push("opportunityId must be a string");
  }

  if (data.createdBy !== undefined && typeof data.createdBy !== "string") {
    errors.push("createdBy must be a string");
  }

  if (data.approverId !== undefined && data.approverId !== null && typeof data.approverId !== "string") {
    errors.push("approverId must be a string");
  }

  if (data.discountPct !== undefined) {
    if (typeof data.discountPct !== "number" || isNaN(data.discountPct) || data.discountPct < 0 || data.discountPct > 100) {
      errors.push("discountPct must be a number between 0 and 100");
    }
  }

  if (data.riskLevel !== undefined && !orderRiskLevels.includes(data.riskLevel)) {
    errors.push(`Invalid riskLevel. Allowed values: ${orderRiskLevels.join(", ")}`);
  }

  if (data.riskScore !== undefined && (typeof data.riskScore !== "number" || isNaN(data.riskScore) || data.riskScore < 0)) {
    errors.push("riskScore must be a non-negative number");
  }

  if (data.approvalStatus !== undefined && !orderApprovalStatuses.includes(data.approvalStatus)) {
    errors.push(`Invalid approvalStatus. Allowed values: ${orderApprovalStatuses.join(", ")}`);
  }

  if (data.inventoryStatus !== undefined && !orderInventoryStatuses.includes(data.inventoryStatus)) {
    errors.push(`Invalid inventoryStatus. Allowed values: ${orderInventoryStatuses.join(", ")}`);
  }

  if (data.paymentStatus !== undefined && !orderPaymentStatuses.includes(data.paymentStatus)) {
    errors.push(`Invalid paymentStatus. Allowed values: ${orderPaymentStatuses.join(", ")}`);
  }

  if (data.terms !== undefined && typeof data.terms !== "string") {
    errors.push("terms must be a string");
  }

  if (data.changeNote !== undefined && data.changeNote !== null && typeof data.changeNote !== "string") {
    errors.push("changeNote must be a string");
  }

  if (data.rejectReason !== undefined && data.rejectReason !== null && typeof data.rejectReason !== "string") {
    errors.push("rejectReason must be a string");
  }

  if (data.lines !== undefined) {
    if (!Array.isArray(data.lines)) {
      errors.push("lines must be an array");
    } else {
      if (isUpdate && data.lines.length === 0) {
        errors.push("lines array cannot be empty if provided");
      }
      data.lines.forEach((line: any, index: number) => {
        if (!line.productId || typeof line.productId !== "string") {
          errors.push(`Line at index ${index} must have a valid productId`);
        }
        const qty = line.qty ?? line.quantity;
        if (qty === undefined || typeof qty !== "number" || !Number.isInteger(qty) || qty <= 0) {
          errors.push(`Line at index ${index} must have an integer quantity (qty) > 0`);
        }
        if (line.unitPrice === undefined || typeof line.unitPrice !== "number" || line.unitPrice < 0) {
          errors.push(`Line at index ${index} must have a unitPrice >= 0`);
        }
      });
    }
  }

  return errors;
}
