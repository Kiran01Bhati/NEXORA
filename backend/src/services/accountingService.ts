import { prisma } from "../prisma";

export interface LedgerFilter {
  account?: string;
  reference?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateLedgerInput {
  account: string;
  description: string;
  reference?: string;
  debit?: number;
  credit?: number;
  date?: string | Date;
}

export class AccountingService {
  /**
   * Retrieves high-level financial summary calculated dynamically from persisted records.
   */
  async getFinancialSummary(startDate?: Date, endDate?: Date) {
    const invoiceWhere: any = {};
    const paymentWhere: any = {};

    if (startDate || endDate) {
      invoiceWhere.issuedAt = {};
      paymentWhere.date = {};
      if (startDate) {
        invoiceWhere.issuedAt.gte = startDate;
        paymentWhere.date.gte = startDate;
      }
      if (endDate) {
        invoiceWhere.issuedAt.lte = endDate;
        paymentWhere.date.lte = endDate;
      }
    }

    const [invoices, payments, customers, salesOrders] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: {
          customer: {
            select: {
              id: true,
              company: true,
            },
          },
        },
      }),
      prisma.payment.findMany({
        where: paymentWhere,
      }),
      prisma.customer.findMany({
        select: {
          id: true,
          company: true,
          creditLimit: true,
          outstanding: true,
          status: true,
        },
      }),
      prisma.salesOrder.findMany({
        select: {
          id: true,
          total: true,
          paymentStatus: true,
          approvalStatus: true,
        },
      }),
    ]);

    const now = new Date();

    // 1. Invoices calculations
    let totalInvoiced = 0;
    let totalGrossInvoiced = 0;
    let totalDiscountInvoiced = 0;
    let totalTaxInvoiced = 0;
    let totalInvoicePaid = 0;
    let totalInvoiceOutstanding = 0;
    let totalOverdueAmount = 0;
    let overdueCount = 0;

    const invoicesByStatus: Record<string, { count: number; totalAmount: number; outstandingAmount: number }> = {
      Draft: { count: 0, totalAmount: 0, outstandingAmount: 0 },
      Issued: { count: 0, totalAmount: 0, outstandingAmount: 0 },
      "Partially Paid": { count: 0, totalAmount: 0, outstandingAmount: 0 },
      Paid: { count: 0, totalAmount: 0, outstandingAmount: 0 },
      Overdue: { count: 0, totalAmount: 0, outstandingAmount: 0 },
    };

    for (const inv of invoices) {
      totalInvoiced += inv.amount;
      totalGrossInvoiced += inv.gross;
      totalDiscountInvoiced += inv.discountAmt;
      totalTaxInvoiced += inv.tax;
      totalInvoicePaid += inv.paid;
      totalInvoiceOutstanding += inv.outstanding;

      const isOverdue = inv.status !== "Paid" && inv.outstanding > 0 && new Date(inv.due) < now;
      if (isOverdue) {
        overdueCount++;
        totalOverdueAmount += inv.outstanding;
      }

      const statusKey = invoicesByStatus[inv.status] ? inv.status : "Issued";
      invoicesByStatus[statusKey].count++;
      invoicesByStatus[statusKey].totalAmount += inv.amount;
      invoicesByStatus[statusKey].outstandingAmount += inv.outstanding;
    }

    // 2. Payments calculations & Demo identification
    let totalPaymentsAmount = 0;
    let demoPaymentsCount = 0;
    let demoPaymentsAmount = 0;
    let standardPaymentsCount = 0;
    let standardPaymentsAmount = 0;
    const paymentsByMethod: Record<string, { count: number; totalAmount: number }> = {};

    for (const p of payments) {
      totalPaymentsAmount += p.amount;

      const isDemo =
        p.reference.toUpperCase().startsWith("DEMO") ||
        p.reference.toUpperCase().startsWith("SIM") ||
        p.method.toUpperCase().includes("DEMO") ||
        p.method.toUpperCase().includes("SIMULAT");

      if (isDemo) {
        demoPaymentsCount++;
        demoPaymentsAmount += p.amount;
      } else {
        standardPaymentsCount++;
        standardPaymentsAmount += p.amount;
      }

      const method = p.method || "Unspecified";
      if (!paymentsByMethod[method]) {
        paymentsByMethod[method] = { count: 0, totalAmount: 0 };
      }
      paymentsByMethod[method].count++;
      paymentsByMethod[method].totalAmount += p.amount;
    }

    // 3. Customer Receivables & Debtors
    let totalCustomerOutstanding = 0;
    const debtors = customers
      .filter((c) => c.outstanding > 0)
      .map((c) => ({
        id: c.id,
        company: c.company,
        creditLimit: c.creditLimit,
        outstanding: c.outstanding,
        utilizationPct: c.creditLimit > 0 ? Math.round((c.outstanding / c.creditLimit) * 100) : 0,
        status: c.status,
      }))
      .sort((a, b) => b.outstanding - a.outstanding);

    for (const c of customers) {
      totalCustomerOutstanding += c.outstanding;
    }

    // 4. Sales Orders reconciliation
    let totalSalesOrdersValue = 0;
    const ordersByPaymentStatus: Record<string, { count: number; totalAmount: number }> = {
      "Not Invoiced": { count: 0, totalAmount: 0 },
      Unpaid: { count: 0, totalAmount: 0 },
      Partial: { count: 0, totalAmount: 0 },
      Paid: { count: 0, totalAmount: 0 },
    };

    for (const ord of salesOrders) {
      totalSalesOrdersValue += ord.total;
      const st = ordersByPaymentStatus[ord.paymentStatus] ? ord.paymentStatus : "Not Invoiced";
      ordersByPaymentStatus[st].count++;
      ordersByPaymentStatus[st].totalAmount += ord.total;
    }

    const round = (val: number) => Math.round(val * 100) / 100;

    return {
      overview: {
        totalRevenue: round(totalInvoiced),
        totalCollected: round(totalPaymentsAmount),
        totalOutstandingReceivables: round(totalInvoiceOutstanding),
        totalOverdueReceivables: round(totalOverdueAmount),
        collectionRatePct:
          totalInvoiced > 0 ? Math.round((totalPaymentsAmount / totalInvoiced) * 1000) / 10 : 0,
      },
      receivables: {
        totalInvoiced: round(totalInvoiced),
        totalGross: round(totalGrossInvoiced),
        totalDiscountGiven: round(totalDiscountInvoiced),
        totalTaxCollected: round(totalTaxInvoiced),
        totalOutstanding: round(totalInvoiceOutstanding),
        overdueCount,
        overdueAmount: round(totalOverdueAmount),
        invoiceCount: invoices.length,
        statusBreakdown: Object.entries(invoicesByStatus).map(([status, data]) => ({
          status,
          count: data.count,
          totalAmount: round(data.totalAmount),
          outstandingAmount: round(data.outstandingAmount),
        })),
      },
      collections: {
        totalPaymentsCount: payments.length,
        totalPaymentsAmount: round(totalPaymentsAmount),
        demoPayments: {
          count: demoPaymentsCount,
          totalAmount: round(demoPaymentsAmount),
          isSimulated: true,
          percentage:
            totalPaymentsAmount > 0
              ? Math.round((demoPaymentsAmount / totalPaymentsAmount) * 1000) / 10
              : 0,
        },
        standardPayments: {
          count: standardPaymentsCount,
          totalAmount: round(standardPaymentsAmount),
        },
        methodBreakdown: Object.entries(paymentsByMethod).map(([method, data]) => ({
          method,
          count: data.count,
          totalAmount: round(data.totalAmount),
        })),
      },
      customersSummary: {
        totalCustomers: customers.length,
        customersWithBalanceCount: debtors.length,
        totalCustomerOutstanding: round(totalCustomerOutstanding),
        topDebtors: debtors.slice(0, 5),
      },
      salesOrderReconciliation: {
        totalOrdersCount: salesOrders.length,
        totalOrdersValue: round(totalSalesOrdersValue),
        paymentStatusBreakdown: Object.entries(ordersByPaymentStatus).map(([status, data]) => ({
          status,
          count: data.count,
          totalAmount: round(data.totalAmount),
        })),
      },
    };
  }

  /**
   * Accounts Receivable Aging analysis (Current, 1-30, 31-60, 61-90, 90+ days).
   */
  async getReceivablesAging() {
    const invoices = await prisma.invoice.findMany({
      where: {
        outstanding: { gt: 0 },
      },
      include: {
        customer: {
          select: {
            id: true,
            company: true,
            contact: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { due: "asc" },
    });

    const now = new Date();
    const round = (val: number) => Math.round(val * 100) / 100;

    const buckets = {
      current: { label: "Current (Not Due)", count: 0, amount: 0 },
      days1to30: { label: "1 - 30 Days Overdue", count: 0, amount: 0 },
      days31to60: { label: "31 - 60 Days Overdue", count: 0, amount: 0 },
      days61to90: { label: "61 - 90 Days Overdue", count: 0, amount: 0 },
      days90Plus: { label: "90+ Days Overdue", count: 0, amount: 0 },
    };

    const agingList = invoices.map((inv) => {
      const dueDate = new Date(inv.due);
      const diffTime = now.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const daysOverdue = Math.max(0, diffDays);

      let bucketKey: keyof typeof buckets = "current";
      if (diffDays > 90) {
        bucketKey = "days90Plus";
      } else if (diffDays > 60) {
        bucketKey = "days61to90";
      } else if (diffDays > 30) {
        bucketKey = "days31to60";
      } else if (diffDays > 0) {
        bucketKey = "days1to30";
      }

      buckets[bucketKey].count++;
      buckets[bucketKey].amount += inv.outstanding;

      return {
        id: inv.id,
        amount: inv.amount,
        paid: inv.paid,
        outstanding: inv.outstanding,
        status: inv.status,
        issuedAt: inv.issuedAt,
        due: inv.due,
        daysOverdue,
        bucket: buckets[bucketKey].label,
        customer: inv.customer,
      };
    });

    const totalOutstanding = round(invoices.reduce((sum, inv) => sum + inv.outstanding, 0));

    return {
      summary: {
        totalOutstandingReceivables: totalOutstanding,
        totalUnpaidInvoicesCount: invoices.length,
        buckets: Object.entries(buckets).map(([key, data]) => ({
          key,
          label: data.label,
          count: data.count,
          amount: round(data.amount),
          percentage: totalOutstanding > 0 ? Math.round((data.amount / totalOutstanding) * 1000) / 10 : 0,
        })),
      },
      invoices: agingList,
    };
  }

  /**
   * Customer balances and credit tracking.
   */
  async getCustomerBalances() {
    const customers = await prisma.customer.findMany({
      include: {
        invoices: {
          select: {
            id: true,
            amount: true,
            paid: true,
            outstanding: true,
            status: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            method: true,
            reference: true,
            date: true,
          },
        },
      },
      orderBy: { outstanding: "desc" },
    });

    const round = (val: number) => Math.round(val * 100) / 100;

    return customers.map((c) => {
      const totalInvoiced = round(c.invoices.reduce((s, inv) => s + inv.amount, 0));
      const totalPaid = round(c.payments.reduce((s, p) => s + p.amount, 0));
      const availableCredit = round(Math.max(0, c.creditLimit - c.outstanding));
      const utilizationPct =
        c.creditLimit > 0 ? Math.min(100, Math.round((c.outstanding / c.creditLimit) * 100)) : 0;

      return {
        id: c.id,
        company: c.company,
        contact: c.contact,
        email: c.email,
        phone: c.phone,
        city: c.city,
        industry: c.industry,
        status: c.status,
        creditLimit: c.creditLimit,
        outstanding: c.outstanding,
        availableCredit,
        creditUtilizationPct: utilizationPct,
        totalInvoiced,
        totalPaid,
        invoiceCount: c.invoices.length,
        paymentCount: c.payments.length,
      };
    });
  }

  /**
   * Detailed financial statement for a single customer.
   */
  async getCustomerStatement(customerId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        invoices: {
          orderBy: { issuedAt: "desc" },
        },
        payments: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!customer) {
      throw new Error(`Customer not found with id: ${customerId}`);
    }

    const round = (val: number) => Math.round(val * 100) / 100;
    const totalInvoiced = round(customer.invoices.reduce((s, inv) => s + inv.amount, 0));
    const totalPaid = round(customer.payments.reduce((s, p) => s + p.amount, 0));
    const availableCredit = round(Math.max(0, customer.creditLimit - customer.outstanding));

    return {
      customer: {
        id: customer.id,
        company: customer.company,
        contact: customer.contact,
        email: customer.email,
        phone: customer.phone,
        city: customer.city,
        industry: customer.industry,
        creditLimit: customer.creditLimit,
        outstanding: customer.outstanding,
        availableCredit,
        status: customer.status,
      },
      financialSummary: {
        totalInvoiced,
        totalPaid,
        currentOutstanding: customer.outstanding,
        invoicesCount: customer.invoices.length,
        paymentsCount: customer.payments.length,
      },
      invoices: customer.invoices,
      payments: customer.payments.map((p) => ({
        ...p,
        isDemo:
          p.reference.toUpperCase().startsWith("DEMO") ||
          p.reference.toUpperCase().startsWith("SIM") ||
          p.method.toUpperCase().includes("DEMO"),
      })),
    };
  }

  /**
   * Retrieves persisted General Ledger entries with debit/credit balance totals.
   */
  async getLedgerEntries(filters?: LedgerFilter) {
    const where: any = {};

    if (filters?.account) {
      where.account = { contains: filters.account, mode: "insensitive" };
    }

    if (filters?.reference) {
      where.reference = { contains: filters.reference, mode: "insensitive" };
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const entries = await prisma.ledgerEntry.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const round = (val: number) => Math.round(val * 100) / 100;
    let totalDebit = 0;
    let totalCredit = 0;

    for (const entry of entries) {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
    }

    return {
      summary: {
        count: entries.length,
        totalDebit: round(totalDebit),
        totalCredit: round(totalCredit),
        netBalance: round(totalDebit - totalCredit),
      },
      entries,
    };
  }

  /**
   * Records a new LedgerEntry record.
   */
  async createLedgerEntry(data: CreateLedgerInput) {
    const round = (val: number) => Math.round(val * 100) / 100;
    const debit = data.debit !== undefined ? round(Number(data.debit)) : 0;
    const credit = data.credit !== undefined ? round(Number(data.credit)) : 0;

    const reference =
      data.reference?.trim() ||
      `GL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const date = data.date ? new Date(data.date) : new Date();

    return await prisma.ledgerEntry.create({
      data: {
        account: data.account.trim(),
        description: data.description.trim(),
        reference,
        debit,
        credit,
        date,
      },
    });
  }

  /**
   * Synchronizes persisted invoices and payments into the General Ledger.
   * Seamlessly bridges existing transaction records into LedgerEntry without altering schemas.
   */
  async syncLedgerFromTransactions() {
    const [invoices, payments, existingLedger] = await Promise.all([
      prisma.invoice.findMany({
        include: { customer: { select: { company: true } } },
      }),
      prisma.payment.findMany({
        include: { customer: { select: { company: true } } },
      }),
      prisma.ledgerEntry.findMany({
        select: { reference: true },
      }),
    ]);

    const existingRefs = new Set(existingLedger.map((l) => l.reference));
    const entriesToCreate: {
      account: string;
      description: string;
      reference: string;
      debit: number;
      credit: number;
      date: Date;
    }[] = [];

    // For each invoice, create Accounts Receivable (Debit) and Sales Revenue (Credit)
    for (const inv of invoices) {
      const invRef = `INV-${inv.id.substring(0, 8).toUpperCase()}`;
      if (!existingRefs.has(invRef)) {
        // Accounts Receivable Debit
        entriesToCreate.push({
          account: "Accounts Receivable",
          description: `Invoice issued to ${inv.customer?.company || "Customer"}`,
          reference: invRef,
          debit: inv.amount,
          credit: 0,
          date: inv.issuedAt,
        });
        // Sales Revenue Credit
        entriesToCreate.push({
          account: "Sales Revenue",
          description: `Revenue from invoice ${invRef}`,
          reference: invRef,
          debit: 0,
          credit: inv.amount,
          date: inv.issuedAt,
        });
      }
    }

    // For each payment, create Cash/Bank (Debit) and Accounts Receivable (Credit)
    for (const pay of payments) {
      const payRef = pay.reference || `PAY-${pay.id.substring(0, 8).toUpperCase()}`;
      if (!existingRefs.has(payRef)) {
        const isDemo =
          pay.reference.toUpperCase().startsWith("DEMO") ||
          pay.reference.toUpperCase().startsWith("SIM") ||
          pay.method.toUpperCase().includes("DEMO");

        const accountName = isDemo ? "Demo Cash & Bank" : "Cash & Bank";

        // Cash & Bank Debit
        entriesToCreate.push({
          account: accountName,
          description: `Payment received from ${pay.customer?.company || "Customer"} (${pay.method})`,
          reference: payRef,
          debit: pay.amount,
          credit: 0,
          date: pay.date,
        });
        // Accounts Receivable Credit
        entriesToCreate.push({
          account: "Accounts Receivable",
          description: `Payment applied for invoice ${pay.invoiceId.substring(0, 8).toUpperCase()}`,
          reference: payRef,
          debit: 0,
          credit: pay.amount,
          date: pay.date,
        });
      }
    }

    if (entriesToCreate.length > 0) {
      await prisma.ledgerEntry.createMany({
        data: entriesToCreate,
      });
    }

    return {
      syncedEntriesCount: entriesToCreate.length,
      syncedInvoicesCount: invoices.length,
      syncedPaymentsCount: payments.length,
    };
  }
}

export const accountingService = new AccountingService();

