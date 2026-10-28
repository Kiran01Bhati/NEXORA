import { prisma } from "../prisma";

export class InvoicesService {
  async getAllInvoices() {
    return await prisma.invoice.findMany({
      include: {
        customer: {
          select: {
            id: true,
            company: true,
            contact: true,
            email: true,
            phone: true,
            city: true,
          },
        },
        order: {
          include: {
            lines: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    price: true,
                  },
                },
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            date: true,
            status: true,
            reference: true,
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });
  }

  async getInvoiceById(id: string) {
    return await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            company: true,
            contact: true,
            email: true,
            phone: true,
            city: true,
            creditLimit: true,
            outstanding: true,
          },
        },
        order: {
          include: {
            lines: {
              include: {
                product: {
                  select: {
                    id: true,
                    sku: true,
                    name: true,
                    category: true,
                    kind: true,
                    price: true,
                  },
                },
              },
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        payments: true,
      },
    });
  }

  async createInvoice(data: any) {
    if (!data.orderId) {
      throw new Error("Invalid orderId: orderId is required");
    }

    const order = await prisma.salesOrder.findUnique({
      where: { id: data.orderId },
      include: { customer: true, invoices: true },
    });

    if (!order) {
      throw new Error("Invalid orderId: Sales order not found");
    }

    if (order.approvalStatus === "Rejected") {
      throw new Error("Cannot create invoice for a rejected sales order");
    }

    if (order.approvalStatus === "Pending" || order.approvalStatus === "Changes Requested") {
      throw new Error("Cannot create invoice for an unapproved sales order");
    }

    // Prevent duplicate invoices for the same sales order
    if (order.invoices && order.invoices.length > 0) {
      throw new Error("An invoice has already been issued for this sales order");
    }

    // Prevent marking invoice as Paid/Partially Paid on creation without payments
    if (data.status === "Paid" || data.status === "Partially Paid") {
      throw new Error("Cannot create invoice with status Paid or Partially Paid without recorded payments");
    }

    // Calculate amounts on the server strictly using persisted Sales Order values
    const gross = order.gross;
    const discountPct = order.discountPct;
    const discountAmt = order.discountAmt;
    const net = order.net;
    const tax = order.tax;
    const amount = order.total;
    const paid = 0;
    const outstanding = amount;

    const issuedAt = data.issuedAt ? new Date(data.issuedAt) : new Date();
    let due: Date;
    if (data.due) {
      due = new Date(data.due);
    } else {
      due = new Date(issuedAt);
      due.setDate(due.getDate() + 14); // 14-day payment terms default
    }

    const status = data.status || "Issued";
    const notes = data.notes || null;

    return await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          orderId: order.id,
          customerId: order.customerId,
          gross,
          discountPct,
          discountAmt,
          net,
          tax,
          amount,
          paid,
          outstanding,
          status,
          issuedAt,
          due,
          notes,
        },
        include: {
          customer: true,
          order: {
            include: {
              lines: {
                include: {
                  product: true,
                },
              },
            },
          },
          payments: true,
        },
      });

      // Update order payment status to Unpaid if it was Not Invoiced
      if (order.paymentStatus === "Not Invoiced") {
        await tx.salesOrder.update({
          where: { id: order.id },
          data: { paymentStatus: "Unpaid" },
        });
      }

      // Update customer outstanding balance
      await tx.customer.update({
        where: { id: order.customerId },
        data: {
          outstanding: { increment: amount },
          lastActivity: issuedAt,
        },
      });

      return invoice;
    });
  }

  async updateInvoice(id: string, data: any) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true, customer: true, order: true },
    });

    if (!existing) {
      throw new Error("Invoice not found");
    }

    // Business rule: Do not mark invoices as paid without corresponding payment records or zero outstanding
    if (data.status === "Paid") {
      const totalPaid = existing.payments.reduce((sum, p) => sum + p.amount, 0);
      if (existing.outstanding > 0 && totalPaid < existing.amount) {
        throw new Error("Cannot mark invoice as Paid when outstanding balance remains");
      }
    }

    if (data.status === "Partially Paid") {
      const totalPaid = existing.payments.reduce((sum, p) => sum + p.amount, 0);
      if (existing.paid === 0 && totalPaid === 0) {
        throw new Error("Cannot mark invoice as Partially Paid without recorded payments");
      }
    }

    const updateData: any = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    if (data.due !== undefined) {
      updateData.due = new Date(data.due);
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          order: {
            include: {
              lines: {
                include: {
                  product: true,
                },
              },
            },
          },
          payments: true,
        },
      });

      // If status changed to Paid or Partially Paid, sync order paymentStatus if order exists
      if (existing.orderId && (data.status === "Paid" || data.status === "Partially Paid")) {
        const newPaymentStatus = data.status === "Paid" ? "Paid" : "Partial";
        await tx.salesOrder.update({
          where: { id: existing.orderId },
          data: { paymentStatus: newPaymentStatus },
        });
      }

      return updated;
    });
  }

  async deleteInvoice(id: string) {
    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { payments: true },
    });

    if (!existing) {
      throw new Error("Invoice not found");
    }

    if (existing.payments && existing.payments.length > 0) {
      throw new Error("Cannot delete invoice with recorded payments");
    }

    if (existing.status === "Paid") {
      throw new Error("Cannot delete a paid invoice");
    }

    return await prisma.$transaction(async (tx) => {
      // Revert customer outstanding
      if (existing.amount > 0) {
        await tx.customer.update({
          where: { id: existing.customerId },
          data: {
            outstanding: { decrement: existing.outstanding },
          },
        });
      }

      // Revert sales order payment status if linked
      if (existing.orderId) {
        await tx.salesOrder.update({
          where: { id: existing.orderId },
          data: { paymentStatus: "Not Invoiced" },
        });
      }

      return await tx.invoice.delete({
        where: { id },
      });
    });
  }
}

export const invoicesService = new InvoicesService();
