import { Request, Response } from "express";
import { accountingService } from "../services/accountingService";
import { validateDateRange, validateLedgerEntryData } from "../validation/accounting";

export class AccountingController {
  async getSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const dateErrors = validateDateRange(startDate, endDate);
      if (dateErrors.length > 0) {
        return res.status(400).json({ errors: dateErrors });
      }

      const sDate = startDate ? new Date(startDate as string) : undefined;
      const eDate = endDate ? new Date(endDate as string) : undefined;

      const summary = await accountingService.getFinancialSummary(sDate, eDate);
      res.json(summary);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch financial summary" });
    }
  }

  async getReceivables(_req: Request, res: Response) {
    try {
      const aging = await accountingService.getReceivablesAging();
      res.json(aging);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch accounts receivable aging" });
    }
  }

  async getCustomerBalances(_req: Request, res: Response) {
    try {
      const balances = await accountingService.getCustomerBalances();
      res.json(balances);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch customer balances" });
    }
  }

  async getCustomerStatement(req: Request, res: Response): Promise<any> {
    try {
      const customerId = req.params.customerId as string;
      const statement = await accountingService.getCustomerStatement(customerId);
      res.json(statement);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("not found")) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to fetch customer statement" });
    }
  }

  async getLedger(req: Request, res: Response) {
    try {
      const { account, reference, startDate, endDate } = req.query;
      const dateErrors = validateDateRange(startDate, endDate);
      if (dateErrors.length > 0) {
        return res.status(400).json({ errors: dateErrors });
      }

      const sDate = startDate ? new Date(startDate as string) : undefined;
      const eDate = endDate ? new Date(endDate as string) : undefined;

      const ledger = await accountingService.getLedgerEntries({
        account: account as string | undefined,
        reference: reference as string | undefined,
        startDate: sDate,
        endDate: eDate,
      });

      res.json(ledger);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch ledger entries" });
    }
  }

  async createLedgerEntry(req: Request, res: Response): Promise<any> {
    try {
      const errors = validateLedgerEntryData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const entry = await accountingService.createLedgerEntry(req.body);
      res.status(201).json(entry);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create ledger entry" });
    }
  }

  async syncLedger(_req: Request, res: Response) {
    try {
      const result = await accountingService.syncLedgerFromTransactions();
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to sync transactions into ledger" });
    }
  }
}

export const accountingController = new AccountingController();

