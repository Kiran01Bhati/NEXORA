import { prisma } from "../prisma";

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method?: string;
  reference?: string;
  recordedBy?: string;
  date?: string | Date;
}

export interface PaymentFilters {
  invoiceId?: string;
  customerId?: string;
  demoOnly?: boolean;
}

export class PaymentsService {
  async getAllPayments(filters?: PaymentFilters) {
    const where: any = {};

    if (filters?.invoiceId) {
      where.invoiceId = filters.invoiceId;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.demoOnly) {
      where.OR = [
        { reference: { startsWith: "DEMO" } },
        { reference: { startsWith: "SIM" } },
        { method: { in: ["DEMO", "Simulated", "DEMO_SIMULATION"] } },
      ];
    }

    return await prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            amount: true,
            paid: true,
            outstanding: true,
            status: true,
            orderId: true,
          },
        },
        customer: {
          select: {
            id: true,
            company: true,
            contact: true,
            email: true,
            phone: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  async getPaymentById(id: string) {
    return await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            order: {
              select: {
                id: true,
                total: true,
                paymentStatus: true,
                approvalStatus: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            company: true,
            contact: true,
            email: true,
            phone: true,
            outstanding: true,
            creditLimit: true,
          },
        },
        recorder: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async recordSimulatedPayment(data: RecordPaymentInput) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: {
        customer: true,
        order: true,
      },
    });

    if (!invoice) {
      throw new Error(`Invoice not found with id: ${data.invoiceId}`);
    }

    if (invoice.status === "Draft") {
      throw new Error("Cannot record payment for a draft invoice. Invoice must be issued first.");
    }

    if (invoice.status === "Paid" || invoice.outstanding <= 0) {
      throw new Error("Invoice is already fully paid. Outstanding balance is 0.");
    }

    // Precise 2-decimal place calculations
    const paymentAmount = Math.round(Number(data.amount) * 100) / 100;
    if (paymentAmount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const currentOutstanding = Math.round(invoice.outstanding * 100) / 100;
    if (paymentAmount > currentOutstanding) {
      throw new Error(
        `Payment amount (${paymentAmount.toFixed(2)}) exceeds invoice outstanding balance (${currentOutstanding.toFixed(2)}). Overpayment is not allowed.`
      );
    }

    // Resolve recordedBy user
    let recordedBy = data.recordedBy?.trim();
    if (recordedBy) {
      const user = await prisma.user.findUnique({ where: { id: recordedBy } });
      if (!user) {
        throw new Error(`Invalid recordedBy: User '${recordedBy}' not found`);
      }
    } else {
      if (invoice.customer?.ownerId) {
        recordedBy = invoice.customer.ownerId;
      } else if (invoice.order?.createdBy) {
        recordedBy = invoice.order.createdBy;
      } else {
        const defaultUser = await prisma.user.findFirst();
        if (!defaultUser) {
          throw new Error("No user found in the system to record the payment");
        }
        recordedBy = defaultUser.id;
      }
    }

    // Standardize demo reference to clearly identify as simulated
    let reference = data.reference?.trim();
    if (!reference) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
      reference = `DEMO-PAY-${timestamp}-${rand}`;
    } else if (!reference.toUpperCase().startsWith("DEMO-") && !reference.toUpperCase().startsWith("SIM-")) {
      reference = `DEMO-${reference}`;
    }

    const method = data.method?.trim() || "DEMO";
    const paymentDate = data.date ? new Date(data.date) : new Date();
    const paymentStatus = "Cleared";

    return await prisma.$transaction(async (tx) => {
      // 1. Create simulated payment record
      const payment = await tx.payment.create({
        data: {
          amount: paymentAmount,
          method,
          reference,
          date: paymentDate,
          status: paymentStatus,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          recordedBy: recordedBy!,
        },
        include: {
          customer: {
            select: {
              id: true,
              company: true,
              contact: true,
              email: true,
            },
          },
          recorder: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      // 2. Update Invoice paid and outstanding
      const newPaid = Math.round((invoice.paid + paymentAmount) * 100) / 100;
      const newOutstanding = Math.max(0, Math.round((invoice.amount - newPaid) * 100) / 100);
      const newInvoiceStatus = newOutstanding === 0 ? "Paid" : "Partially Paid";

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paid: newPaid,
          outstanding: newOutstanding,
          status: newInvoiceStatus,
        },
      });

      // 3. Update Customer outstanding balance
      await tx.customer.update({
        where: { id: invoice.customerId },
        data: {
          outstanding: { decrement: paymentAmount },
          lastActivity: paymentDate,
        },
      });

      // 4. Update SalesOrder paymentStatus if order is linked
      if (invoice.orderId) {
        const newOrderPaymentStatus = newOutstanding === 0 ? "Paid" : "Partial";
        await tx.salesOrder.update({
          where: { id: invoice.orderId },
          data: {
            paymentStatus: newOrderPaymentStatus,
          },
        });
      }

      return {
        ...payment,
        invoice: updatedInvoice,
      };
    });
  }
}

export const paymentsService = new PaymentsService();

