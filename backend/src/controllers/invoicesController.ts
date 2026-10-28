import { Request, Response } from "express";
import { invoicesService } from "../services/invoicesService";
import { validateInvoiceData } from "../validation/invoices";

export class InvoicesController {
  async getAll(req: Request, res: Response) {
    try {
      const invoices = await invoicesService.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  }

  async getById(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const invoice = await invoicesService.getInvoiceById(id);

      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      res.json(invoice);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch invoice" });
    }
  }

  async create(req: Request, res: Response): Promise<any> {
    try {
      const errors = validateInvoiceData(req.body, false);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const invoice = await invoicesService.createInvoice(req.body);
      res.status(201).json(invoice);
    } catch (error: any) {
      console.error(error);
      if (
        error.message?.includes("Invalid orderId") ||
        error.message?.includes("Cannot create invoice") ||
        error.message?.includes("already been issued") ||
        error.message?.includes("orderId is required")
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create invoice" });
    }
  }

  async update(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const errors = validateInvoiceData(req.body, true);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const updated = await invoicesService.updateInvoice(id, req.body);
      res.json(updated);
    } catch (error: any) {
      console.error(error);
      if (error.message === "Invoice not found") {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message?.includes("Cannot mark invoice") ||
        error.message?.includes("Invalid")
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update invoice" });
    }
  }

  async delete(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      await invoicesService.deleteInvoice(id);
      res.status(204).send();
    } catch (error: any) {
      console.error(error);
      if (error.message === "Invoice not found") {
        return res.status(404).json({ error: error.message });
      }
      if (error.message?.includes("Cannot delete")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete invoice" });
    }
  }
}

export const invoicesController = new InvoicesController();
