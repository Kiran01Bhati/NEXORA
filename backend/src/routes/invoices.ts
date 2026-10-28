import { Router } from "express";
import { invoicesController } from "../controllers/invoicesController";

const router = Router();

router.get("/", invoicesController.getAll);
router.post("/", invoicesController.create);
router.get("/:id", invoicesController.getById);
router.patch("/:id", invoicesController.update);
router.delete("/:id", invoicesController.delete);

export default router;
