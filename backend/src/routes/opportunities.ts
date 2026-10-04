import { Router } from "express";
import { opportunitiesController } from "../controllers/opportunitiesController";

const router = Router();

router.get("/", opportunitiesController.getAll);
router.post("/", opportunitiesController.create);
router.get("/:id", opportunitiesController.getById);
router.patch("/:id", opportunitiesController.update);
router.delete("/:id", opportunitiesController.delete);

export default router;
