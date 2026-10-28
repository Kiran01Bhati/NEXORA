import { Router } from "express";
import { salesOrdersController } from "../controllers/salesOrdersController";

const router = Router();

router.get("/", salesOrdersController.getAll);
router.post("/", salesOrdersController.create);
router.get("/:id", salesOrdersController.getById);
router.patch("/:id", salesOrdersController.update);
router.put("/:id", salesOrdersController.update);
router.delete("/:id", salesOrdersController.delete);

export default router;
