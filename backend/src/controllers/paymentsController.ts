import { Request, Response } from "express";
import { paymentsService } from "../services/paymentsService";
import { validatePaymentData } from "../validation/payments";

export class PaymentsController {
  async getAll(req: Request, res: Response) {
    try {
      const invoiceId = req.query.invoiceId as string | undefined;
      const customerId = req.query.customerId as string | undefined;
      const demoOnly = req.query.demoOnly === "true" || req.query.demo === "true";

      const payments = await paymentsService.getAllPayments({ invoiceId, customerId, demoOnly });
      res.json(payments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  }

  async getDemoPayments(_req: Request, res: Response) {
    try {
      const payments = await paymentsService.getAllPayments({ demoOnly: true });
      res.json(payments);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch demo payments" });
    }
  }

  async getById(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const payment = await paymentsService.getPaymentById(id);

      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  }

  async create(req: Request, res: Response): Promise<any> {
    try {
      const errors = validatePaymentData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const result = await paymentsService.recordSimulatedPayment(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("Invoice not found")) {
        return res.status(404).json({ error: error.message });
      }
      if (
        error.message?.includes("exceeds") ||
        error.message?.includes("fully paid") ||
        error.message?.includes("draft") ||
        error.message?.includes("Invalid") ||
        error.message?.includes("No user found")
      ) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to record payment" });
    }
  }
}

export const paymentsController = new PaymentsController();

