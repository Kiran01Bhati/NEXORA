export const opportunityStages = ["qualification", "proposal", "negotiation", "won", "lost"] as const;
export type OpportunityStage = typeof opportunityStages[number];

export const opportunityStatuses = ["open", "won", "lost"] as const;
export type OpportunityStatus = typeof opportunityStatuses[number];

export function validateOpportunityData(data: any) {
  const errors: string[] = [];
  
  if (!data.leadId) errors.push("leadId is required");
  if (!data.title) errors.push("title is required");
  
  if (data.estimatedValue !== undefined && data.estimatedValue < 0) {
    errors.push("estimatedValue cannot be negative");
  }
  
  if (data.probability !== undefined && (data.probability < 0 || data.probability > 100)) {
    errors.push("probability must be between 0 and 100");
  }
  
  if (data.stage && !opportunityStages.includes(data.stage)) {
    errors.push("Invalid stage");
  }
  
  if (data.status && !opportunityStatuses.includes(data.status)) {
    errors.push("Invalid status");
  }
  
  if (data.expectedCloseDate && isNaN(Date.parse(data.expectedCloseDate))) {
    errors.push("Invalid expectedCloseDate");
  }

  return errors;
}
