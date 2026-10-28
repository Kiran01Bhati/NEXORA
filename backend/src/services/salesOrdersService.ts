import { prisma } from "../prisma";

export class SalesOrdersService {
  async getAllSalesOrders() {
    return await prisma.salesOrder.findMany({
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
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            total: true,
            status: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
            status: true,
          },
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            paid: true,
            outstanding: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSalesOrderById(id: string) {
    return await prisma.salesOrder.findUnique({
      where: { id },
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
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            total: true,
            status: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true,
            status: true,
          },
        },
        invoices: {
          select: {
            id: true,
            amount: true,
            paid: true,
            outstanding: true,
            status: true,
          },
        },
      },
    });
  }

  async createSalesOrder(data: any) {
    let quotation = null;
    if (data.quotationId) {
      quotation = await prisma.quotation.findUnique({
        where: { id: data.quotationId },
        include: { items: true, customer: true, opportunity: true },
      });
      if (!quotation) {
        throw new Error("Invalid quotationId: Quotation not found");
      }
      if (quotation.status === "Expired" || quotation.status === "Rejected") {
        throw new Error(`Cannot create order from a quotation with status '${quotation.status}'`);
      }
      if (quotation.status === "Converted" || quotation.orderId) {
        throw new Error("This quotation has already been converted to an order");
      }
      if (!quotation.items || quotation.items.length === 0) {
        throw new Error("Quotation has no items to create an order from");
      }
    }

    // Determine line items
    let rawLines: { productId: string; qty: number; unitPrice: number }[] = [];
    if (quotation) {
      for (const item of quotation.items) {
        if (!item.productId) {
          throw new Error(`Quotation item ${item.id} is missing a productId`);
        }
        rawLines.push({
          productId: item.productId,
          qty: item.quantity,
          unitPrice: item.unitPrice,
        });
      }
    } else if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
      rawLines = data.lines.map((l: any) => ({
        productId: l.productId,
        qty: Number(l.qty ?? l.quantity),
        unitPrice: Number(l.unitPrice),
      }));
    } else {
      throw new Error("Order lines are required");
    }

    if (rawLines.length === 0) {
      throw new Error("At least one order line is required");
    }

    // Validate product existence and valid values for each line
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (!line.productId) {
        throw new Error(`Line at index ${i} must have a productId`);
      }
      if (!line.qty || line.qty <= 0 || !Number.isInteger(line.qty)) {
        throw new Error(`Line at index ${i} must have an integer quantity > 0`);
      }
      if (line.unitPrice === undefined || line.unitPrice < 0) {
        throw new Error(`Line at index ${i} must have a unitPrice >= 0`);
      }
      const product = await prisma.product.findUnique({ where: { id: line.productId } });
      if (!product) {
        throw new Error(`Invalid productId: Product not found (${line.productId})`);
      }
    }

    // Customer validation
    const customerId = data.customerId || quotation?.customerId;
    if (!customerId) {
      throw new Error("Invalid customerId: customerId is required");
    }
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new Error("Invalid customerId: Customer not found");
    }

    // Opportunity validation
    const opportunityId = data.opportunityId || quotation?.opportunityId || null;
    if (opportunityId) {
      const opportunity = await prisma.opportunity.findUnique({ where: { id: opportunityId } });
      if (!opportunity) {
        throw new Error("Invalid opportunityId: Opportunity not found");
      }
    }

    // Creator validation
    const createdBy = data.createdBy || quotation?.createdBy;
    if (!createdBy) {
      throw new Error("Invalid createdBy: createdBy is required");
    }
    const creator = await prisma.user.findUnique({ where: { id: createdBy } });
    if (!creator) {
      throw new Error("Invalid createdBy: User not found");
    }

    // Approver validation (if specified)
    let approverId = data.approverId || null;
    if (approverId) {
      const approver = await prisma.user.findUnique({ where: { id: approverId } });
      if (!approver) {
        throw new Error("Invalid approverId: User not found");
      }
    }

    // Calculate totals strictly from persisted lines - never trust client totals
    let discountPct = 0;
    if (data.discountPct !== undefined) {
      discountPct = Math.max(0, Math.min(100, Number(data.discountPct)));
    } else if (quotation && quotation.subtotal > 0 && quotation.discount > 0) {
      discountPct = Math.round((quotation.discount / quotation.subtotal) * 100);
    }

    const gross = Math.round(rawLines.reduce((sum, line) => sum + line.qty * line.unitPrice, 0));
    const discountAmt = Math.round((gross * discountPct) / 100);
    const net = gross - discountAmt;
    const TAX_RATE = 0.18;
    const tax = Math.round(net * TAX_RATE);
    const total = net + tax;

    // Evaluate Risk & Approval status if not explicitly provided
    let riskLevel = data.riskLevel;
    let riskScore = data.riskScore !== undefined ? Number(data.riskScore) : undefined;

    if (!riskLevel) {
      const isHighValue = gross > 500000;
      const isHighDiscount = discountPct > 20;
      const isCreditBreached = customer.creditLimit > 0 && (customer.outstanding + total) > customer.creditLimit;

      if (isCreditBreached) {
        riskLevel = "Critical";
        riskScore = 25;
      } else if (isHighValue || isHighDiscount) {
        riskLevel = "High";
        riskScore = isHighValue ? 16 : 12;
      } else {
        riskLevel = "Low";
        riskScore = 0;
      }
    }

    if (riskScore === undefined) {
      riskScore = 0;
    }

    let approvalStatus = data.approvalStatus;
    if (!approvalStatus) {
      if (riskLevel === "Medium" || riskLevel === "High" || riskLevel === "Critical") {
        approvalStatus = "Pending";
      } else {
        approvalStatus = "Not Required";
      }
    }

    const defaultTerms =
      "Prices in INR. GST extra at 18%. Goods remain the property of Air Dive Technologies until paid in full. Installation is scheduled after approval and inventory reservation. Orders above the high-value threshold, or discounts above policy, require independent approval.";
    const terms = data.terms || quotation?.terms || defaultTerms;

    return await prisma.$transaction(async (tx) => {
      const newOrder = await tx.salesOrder.create({
        data: {
          customerId,
          createdBy,
          approverId,
          quotationId: quotation?.id || null,
          opportunityId,
          discountPct,
          gross,
          discountAmt,
          net,
          tax,
          total,
          riskLevel,
          riskScore,
          approvalStatus,
          inventoryStatus: data.inventoryStatus || "Not Reserved",
          paymentStatus: data.paymentStatus || "Not Invoiced",
          terms,
          changeNote: data.changeNote || null,
          rejectReason: data.rejectReason || null,
          lines: {
            create: rawLines.map((line) => ({
              productId: line.productId,
              qty: line.qty,
              unitPrice: line.unitPrice,
            })),
          },
        },
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
          customer: true,
          creator: true,
          approver: true,
          quotation: true,
          opportunity: true,
        },
      });

      if (quotation) {
        await tx.quotation.update({
          where: { id: quotation.id },
          data: {
            orderId: newOrder.id,
            status: "Converted",
          },
        });
      }

      return newOrder;
    });
  }

  async updateSalesOrder(id: string, data: any) {
    const existing = await prisma.salesOrder.findUnique({
      where: { id },
      include: { lines: true, invoices: true },
    });

    if (!existing) {
      throw new Error("Sales order not found");
    }

    // Business rule: Cannot modify commercial terms (discountPct, lines) if order is invoiced or fulfilled
    const hasInvoices = existing.invoices && existing.invoices.length > 0;
    const isFulfilled = existing.inventoryStatus === "Fulfilled";

    if ((data.lines !== undefined || data.discountPct !== undefined) && (hasInvoices || isFulfilled)) {
      throw new Error("Cannot modify line items or discount of an order with existing invoices or fulfilled inventory");
    }

    // Business rule: Cannot revert approval status if order already has invoices or is fulfilled
    if (
      data.approvalStatus !== undefined &&
      data.approvalStatus !== "Approved" &&
      existing.approvalStatus === "Approved" &&
      (hasInvoices || isFulfilled)
    ) {
      throw new Error("Cannot revert approval status of an order that has invoices or fulfilled inventory");
    }

    // Business rule: Inventory reservation or fulfillment requires approved or not-required order
    const targetApproval = data.approvalStatus || existing.approvalStatus;
    if (
      (data.inventoryStatus === "Reserved" || data.inventoryStatus === "Fulfilled") &&
      targetApproval !== "Approved" &&
      targetApproval !== "Not Required"
    ) {
      throw new Error("Inventory reservation and fulfillment require an approved order");
    }

    // Validate approver if changed
    if (data.approverId) {
      const approver = await prisma.user.findUnique({ where: { id: data.approverId } });
      if (!approver) {
        throw new Error("Invalid approverId: User not found");
      }
    }

    // Recalculate totals if lines or discountPct change
    let gross = existing.gross;
    let discountPct = data.discountPct !== undefined ? Number(data.discountPct) : existing.discountPct;
    let updatedLines = false;

    if (data.lines && Array.isArray(data.lines)) {
      for (let i = 0; i < data.lines.length; i++) {
        const l = data.lines[i];
        if (!l.productId) throw new Error(`Line at index ${i} must have a productId`);
        const qty = l.qty ?? l.quantity;
        if (!qty || qty <= 0 || !Number.isInteger(qty)) {
          throw new Error(`Line at index ${i} must have an integer quantity > 0`);
        }
        if (l.unitPrice === undefined || l.unitPrice < 0) {
          throw new Error(`Line at index ${i} must have a unitPrice >= 0`);
        }
        const p = await prisma.product.findUnique({ where: { id: l.productId } });
        if (!p) throw new Error(`Invalid productId: Product not found (${l.productId})`);
      }
      updatedLines = true;
      gross = Math.round(data.lines.reduce((sum: number, l: any) => sum + (l.qty ?? l.quantity) * l.unitPrice, 0));
    }

    let discountAmt = existing.discountAmt;
    let net = existing.net;
    let tax = existing.tax;
    let total = existing.total;

    if (updatedLines || data.discountPct !== undefined) {
      discountAmt = Math.round((gross * discountPct) / 100);
      net = gross - discountAmt;
      const TAX_RATE = 0.18;
      tax = Math.round(net * TAX_RATE);
      total = net + tax;
    }

    return await prisma.$transaction(async (tx) => {
      if (updatedLines) {
        await tx.salesOrderLine.deleteMany({ where: { salesOrderId: id } });
        await tx.salesOrderLine.createMany({
          data: data.lines.map((l: any) => ({
            salesOrderId: id,
            productId: l.productId,
            qty: l.qty ?? l.quantity,
            unitPrice: l.unitPrice,
          })),
        });
      }

      const updated = await tx.salesOrder.update({
        where: { id },
        data: {
          ...(data.approvalStatus !== undefined && { approvalStatus: data.approvalStatus }),
          ...(data.inventoryStatus !== undefined && { inventoryStatus: data.inventoryStatus }),
          ...(data.paymentStatus !== undefined && { paymentStatus: data.paymentStatus }),
          ...(data.riskLevel !== undefined && { riskLevel: data.riskLevel }),
          ...(data.riskScore !== undefined && { riskScore: Number(data.riskScore) }),
          ...(data.approverId !== undefined && { approverId: data.approverId }),
          ...(data.terms !== undefined && { terms: data.terms }),
          ...(data.changeNote !== undefined && { changeNote: data.changeNote }),
          ...(data.rejectReason !== undefined && { rejectReason: data.rejectReason }),
          discountPct,
          gross,
          discountAmt,
          net,
          tax,
          total,
        },
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
          customer: true,
          creator: true,
          approver: true,
          quotation: true,
          opportunity: true,
          invoices: true,
        },
      });

      // Synchronize opportunity stage if order is approved
      if (data.approvalStatus === "Approved" && updated.opportunityId) {
        await tx.opportunity.update({
          where: { id: updated.opportunityId },
          data: {
            stage: "won",
            probability: 100,
          },
        });
      }

      return updated;
    });
  }

  async deleteSalesOrder(id: string) {
    const existing = await prisma.salesOrder.findUnique({
      where: { id },
      include: { invoices: true },
    });

    if (!existing) {
      throw new Error("Sales order not found");
    }

    if (existing.invoices && existing.invoices.length > 0) {
      throw new Error("Cannot delete sales order with associated invoices");
    }

    if (existing.paymentStatus === "Paid" || existing.paymentStatus === "Partial") {
      throw new Error("Cannot delete sales order with recorded payments");
    }

    if (existing.inventoryStatus === "Fulfilled") {
      throw new Error("Cannot delete sales order with fulfilled inventory");
    }

    return await prisma.$transaction(async (tx) => {
      // If order was created from a quotation, unlink quotation and restore quotation status to Accepted
      if (existing.quotationId) {
        const quotation = await tx.quotation.findUnique({ where: { id: existing.quotationId } });
        if (quotation && quotation.orderId === id) {
          await tx.quotation.update({
            where: { id: existing.quotationId },
            data: {
              orderId: null,
              status: "Accepted",
            },
          });
        }
      }

      await tx.salesOrderLine.deleteMany({ where: { salesOrderId: id } });
      return await tx.salesOrder.delete({
        where: { id },
      });
    });
  }
}

export const salesOrdersService = new SalesOrdersService();
