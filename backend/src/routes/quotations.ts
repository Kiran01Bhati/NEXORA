import { Router } from "express";
import { quotationsController } from "../controllers/quotationsController";

const router = Router();

router.get("/", quotationsController.getAll);
router.post("/", quotationsController.create);
router.get("/:id", quotationsController.getById);
router.patch("/:id", quotationsController.update);
router.delete("/:id", quotationsController.delete);

export default router;
