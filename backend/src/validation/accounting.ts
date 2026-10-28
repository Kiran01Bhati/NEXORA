export function validateDateRange(startDate?: any, endDate?: any): string[] {
  const errors: string[] = [];

  if (startDate !== undefined && isNaN(Date.parse(startDate))) {
    errors.push("Invalid startDate format. Expected ISO-8601 date string.");
  }

  if (endDate !== undefined && isNaN(Date.parse(endDate))) {
    errors.push("Invalid endDate format. Expected ISO-8601 date string.");
  }

  if (startDate && endDate && !errors.length) {
    if (new Date(startDate) > new Date(endDate)) {
      errors.push("startDate must be before or equal to endDate.");
    }
  }

  return errors;
}

export function validateLedgerEntryData(data: any): string[] {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Request body must be a JSON object.");
    return errors;
  }

  if (!data.account || typeof data.account !== "string" || data.account.trim() === "") {
    errors.push("account is required and must be a non-empty string.");
  }

  if (!data.description || typeof data.description !== "string" || data.description.trim() === "") {
    errors.push("description is required and must be a non-empty string.");
  }

  if (data.reference !== undefined && (typeof data.reference !== "string" || data.reference.trim() === "")) {
    errors.push("reference must be a non-empty string if provided.");
  }

  const debit = data.debit !== undefined ? Number(data.debit) : 0;
  const credit = data.credit !== undefined ? Number(data.credit) : 0;

  if (data.debit !== undefined && (typeof data.debit !== "number" || isNaN(debit) || debit < 0)) {
    errors.push("debit must be a non-negative number.");
  }

  if (data.credit !== undefined && (typeof data.credit !== "number" || isNaN(credit) || credit < 0)) {
    errors.push("credit must be a non-negative number.");
  }

  if (debit === 0 && credit === 0) {
    errors.push("Either debit or credit must be greater than 0.");
  }

  if (data.date !== undefined && isNaN(Date.parse(data.date))) {
    errors.push("Invalid date format.");
  }

  return errors;
}

