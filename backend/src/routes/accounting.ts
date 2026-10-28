import { Router } from "express";
import { accountingController } from "../controllers/accountingController";

const router = Router();

// Financial Summaries & Receivables
router.get("/summary", accountingController.getSummary);
router.get("/overview", accountingController.getSummary);
router.get("/receivables", accountingController.getReceivables);
router.get("/aging", accountingController.getReceivables);

// Customer Financial Records & Statements
router.get("/customers", accountingController.getCustomerBalances);
router.get("/customers/:customerId", accountingController.getCustomerStatement);

// General Ledger Integration
router.get("/ledger", accountingController.getLedger);
router.post("/ledger", accountingController.createLedgerEntry);
router.post("/ledger/sync", accountingController.syncLedger);

export default router;

