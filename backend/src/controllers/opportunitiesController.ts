import { Request, Response } from "express";
import { opportunitiesService } from "../services/opportunitiesService";
import { validateOpportunityData } from "../validation/opportunities";

export class OpportunitiesController {
  async getAll(req: Request, res: Response) {
    try {
      const opportunities = await opportunitiesService.getAllOpportunities();
      res.json(opportunities);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  }

  async getById(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      const opportunity = await opportunitiesService.getOpportunityById(id);
      
      if (!opportunity) {
        return res.status(404).json({ error: "Opportunity not found" });
      }
      
      res.json(opportunity);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch opportunity" });
    }
  }

  async create(req: Request, res: Response): Promise<any> {
    try {
      const errors = validateOpportunityData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const opportunity = await opportunitiesService.createOpportunity(req.body);
      res.status(201).json(opportunity);
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("Invalid leadId")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to create opportunity" });
    }
  }

  async update(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      
      let errors = validateOpportunityData(req.body);

      if (req.body.leadId === undefined) {
        errors = errors.filter((e: string) => e !== "leadId is required");
      }
      if (req.body.title === undefined) {
        errors = errors.filter((e: string) => e !== "title is required");
      }
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      const opportunity = await opportunitiesService.updateOpportunity(id, req.body);
      res.json(opportunity);
    } catch (error: any) {
      console.error(error);
      if (error.message === "Opportunity not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to update opportunity" });
    }
  }

  async delete(req: Request, res: Response): Promise<any> {
    try {
      const id = req.params.id as string;
      await opportunitiesService.deleteOpportunity(id);
      res.status(204).send();
    } catch (error: any) {
      console.error(error);
      if (error.message === "Opportunity not found") {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to delete opportunity" });
    }
  }
}

export const opportunitiesController = new OpportunitiesController();
