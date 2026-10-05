import { Request, Response } from "express";
import { quotationsService } from "../services/quotationsService";
import { validateQuotationData } from "../validation/quotations";

export class QuotationsController {
  async getAll(req: Request, res: Response) {
    try {
      const quotations = await quotationsService.getAllQuotations();
      res.json(quotations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch quotations" });
    }
  }

  async getById(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const quotation = await quotationsService.getQuotationById(id);

      if (!quotation) {
        return res.status(404).json({ error: "Quotation not found" });
      }

      res.json(quotation);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch quotation" });
    }
  }

  async create(req: Request, res: Response): Promise<any> {
    try {
      const errors = validateQuotationData(req.body, false);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const quotation = await quotationsService.createQuotation(req.body);
      res.status(201).json(quotation);
    } catch (error: any) {
      console.error(error);
      if (
        error.message.includes("Invalid opportunityId") ||
        error.message.includes("Invalid leadId") ||
        error.message.includes("Invalid customerId")
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create quotation" });
    }
  }

  async update(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;

      const errors = validateQuotationData(req.body, true);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const quotation = await quotationsService.updateQuotation(id, req.body);
      res.json(quotation);
    } catch (error: any) {
      console.error(error);
      if (error.message === "Quotation not found") {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message.includes("Invalid opportunityId") ||
        error.message.includes("Invalid leadId") ||
        error.message.includes("Invalid customerId")
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update quotation" });
    }
  }

  async delete(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      await quotationsService.deleteQuotation(id);
      res.status(204).send();
    } catch (error: any) {
      console.error(error);
      if (error.message === "Quotation not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete quotation" });
    }
  }
}

export const quotationsController = new QuotationsController();
