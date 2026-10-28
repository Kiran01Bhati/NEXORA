import { Request, Response } from "express";
import { salesOrdersService } from "../services/salesOrdersService";
import { validateSalesOrderData } from "../validation/salesOrders";

export class SalesOrdersController {
  async getAll(req: Request, res: Response) {
    try {
      const orders = await salesOrdersService.getAllSalesOrders();
      res.json(orders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch sales orders" });
    }
  }

  async getById(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const order = await salesOrdersService.getSalesOrderById(id);

      if (!order) {
        return res.status(404).json({ error: "Sales order not found" });
      }

      res.json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch sales order" });
    }
  }

  async create(req: Request, res: Response): Promise<any> {
    try {
      const errors = validateSalesOrderData(req.body, false);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const order = await salesOrdersService.createSalesOrder(req.body);
      res.status(201).json(order);
    } catch (error: any) {
      console.error(error);
      if (
        error.message?.includes("Invalid quotationId") ||
        error.message?.includes("Invalid customerId") ||
        error.message?.includes("Invalid opportunityId") ||
        error.message?.includes("Invalid createdBy") ||
        error.message?.includes("Invalid approverId") ||
        error.message?.includes("Invalid productId") ||
        error.message?.includes("Cannot create order from") ||
        error.message?.includes("already been converted") ||
        error.message?.includes("Quotation has no items") ||
        error.message?.includes("Order lines are required") ||
        error.message?.includes("At least one order line") ||
        error.message?.includes("must have a productId") ||
        error.message?.includes("must have an integer quantity") ||
        error.message?.includes("must have a unitPrice") ||
        error.message?.includes("missing a productId") ||
        error.message?.includes("customerId is required") ||
        error.message?.includes("createdBy is required")
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create sales order" });
    }
  }

  async update(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const errors = validateSalesOrderData(req.body, true);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const updated = await salesOrdersService.updateSalesOrder(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error(error);
      if (error.message === "Sales order not found") {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message?.includes("Cannot modify") ||
        error.message?.includes("Cannot revert") ||
        error.message?.includes("require an approved order") ||
        error.message?.includes("Invalid") ||
        error.message?.includes("must have")
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update sales order" });
    }
  }

  async delete(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      await salesOrdersService.deleteSalesOrder(id);
      res.status(204).send();
    } catch (error: any) {
      console.error(error);
      if (error.message === "Sales order not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message?.includes("Cannot delete")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete sales order" });
    }
  }
}

export const salesOrdersController = new SalesOrdersController();
