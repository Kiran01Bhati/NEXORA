import { Router } from "express";
import { paymentsController } from "../controllers/paymentsController";

const router = Router();

router.get("/", paymentsController.getAll);
router.get("/demo", paymentsController.getDemoPayments);
router.post("/simulate", paymentsController.create);
router.post("/", paymentsController.create);
router.get("/:id", paymentsController.getById);

export default router;

