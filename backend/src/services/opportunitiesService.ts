import { prisma } from "../prisma";

export class OpportunitiesService {
  async getAllOpportunities() {
    return await prisma.opportunity.findMany({
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getOpportunityById(id: string) {
    return await prisma.opportunity.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
            email: true,
          }
        }
      },
    });
  }

  async createOpportunity(data: any) {
    // Check if lead exists
    const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
    if (!lead) {
      throw new Error("Invalid leadId: Lead not found");
    }

    return await prisma.opportunity.create({
      data: {
        leadId: data.leadId,
        title: data.title,
        description: data.description || null,
        estimatedValue: data.estimatedValue,
        probability: data.probability,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        stage: data.stage,
        status: data.status,
      },
    });
  }

  async updateOpportunity(id: string, data: any) {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Opportunity not found");
    }

    return await prisma.opportunity.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.estimatedValue !== undefined && { estimatedValue: data.estimatedValue }),
        ...(data.probability !== undefined && { probability: data.probability }),
        ...(data.expectedCloseDate !== undefined && { 
            expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null 
        }),
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async deleteOpportunity(id: string) {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Opportunity not found");
    }

    return await prisma.opportunity.delete({
      where: { id },
    });
  }
}

export const opportunitiesService = new OpportunitiesService();
