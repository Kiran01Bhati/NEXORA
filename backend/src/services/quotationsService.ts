import { prisma } from "../prisma";

export class QuotationsService {
  async getAllQuotations() {
    return await prisma.quotation.findMany({
      include: {
        items: true,
        opportunity: {
          select: {
            id: true,
            title: true,
          }
        },
        customer: {
          select: {
            id: true,
            company: true,
            contact: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getQuotationById(id: string) {
    return await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        opportunity: {
          select: {
            id: true,
            title: true,
          }
        },
        customer: {
          select: {
            id: true,
            company: true,
            contact: true,
          }
        }
      },
    });
  }

  async createQuotation(data: any) {
    if (data.opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({ where: { id: data.opportunityId } });
      if (!opportunity) {
        throw new Error("Invalid opportunityId: Opportunity not found");
      }
    }

    if (data.leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: data.leadId } });
      if (!lead) {
        throw new Error("Invalid leadId: Lead not found");
      }
    }

    if (data.customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
      if (!customer) {
        throw new Error("Invalid customerId: Customer not found");
      }
    }

    const items = data.items || [];
    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      return {
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
        productId: item.productId || null,
      };
    });

    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const total = subtotal - discount + tax;

    return await prisma.$transaction(async (tx) => {
      return await tx.quotation.create({
        data: {
          opportunityId: data.opportunityId || null,
          customerId: data.customerId || null,
          date: data.date ? new Date(data.date) : new Date(),
          validUntil: data.validUntil ? new Date(data.validUntil) : null,
          status: data.status || "Draft",
          notes: data.notes || null,
          terms: data.terms || null,
          subtotal,
          discount,
          tax,
          total,
          items: {
            create: formattedItems,
          }
        },
        include: { items: true },
      });
    });
  }

  async updateQuotation(id: string, data: any) {
    const existing = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      throw new Error("Quotation not found");
    }

    return await prisma.$transaction(async (tx) => {
      // If we are updating items, we need to replace them
      // The requirement says: "If quotation items are updated, keep item updates transactional. Do not accidentally delete existing items unless the requested update explicitly requires it."
      // Let's assume if data.items is provided, it fully replaces the existing items for simplicity, or we can just update the ones provided.
      // Usually, in a simple CRUD, a full replacement is standard for nested arrays unless IDs are provided.
      // Let's implement full replacement if data.items is provided, since this is standard for line items.

      let subtotal = existing.subtotal;
      let discount = data.discount !== undefined ? data.discount : existing.discount;
      let tax = data.tax !== undefined ? data.tax : existing.tax;

      if (data.items) {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });

        subtotal = 0;
        const formattedItems = data.items.map((item: any) => {
          const lineTotal = item.quantity * item.unitPrice;
          subtotal += lineTotal;
          return {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal,
            productId: item.productId || null,
          };
        });

        await tx.quotation.update({
          where: { id },
          data: {
            items: {
              create: formattedItems
            }
          }
        });
      }

      const total = subtotal - discount + tax;

      return await tx.quotation.update({
        where: { id },
        data: {
          ...(data.opportunityId !== undefined && { opportunityId: data.opportunityId }),
          ...(data.customerId !== undefined && { customerId: data.customerId }),
          ...(data.date !== undefined && { date: new Date(data.date) }),
          ...(data.validUntil !== undefined && { validUntil: data.validUntil ? new Date(data.validUntil) : null }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.terms !== undefined && { terms: data.terms }),
          subtotal,
          discount,
          tax,
          total,
        },
        include: { items: true },
      });
    });
  }

  async deleteQuotation(id: string) {
    const existing = await prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      throw new Error("Quotation not found");
    }

    return await prisma.quotation.delete({
      where: { id },
    });
  }
}

export const quotationsService = new QuotationsService();
