import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

// Get all leads
router.get("/", async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// Create a new lead
router.post("/", async (req, res) => {
  try {
    const { name, company, email, source, value, ownerId } = req.body;
    if (!name || !company || !ownerId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    
    const lead = await prisma.lead.create({
      data: {
        name,
        company,
        email,
        source,
        value,
        ownerId,
      },
    });
    res.status(201).json(lead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create lead" });
  }
});

// Convert Lead
router.post("/:id/convert", async (req, res) => {
  try {
    const { id } = req.params;
    
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (lead.status === "Converted") return res.status(400).json({ error: "Lead already converted" });

    // Ensure customer exists or create one
    let customer = await prisma.customer.findFirst({
      where: { company: lead.company },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          company: lead.company,
          contact: lead.name,
          email: lead.email,
          phone: "-",
          city: "-",
          industry: "General",
          ownerId: lead.ownerId,
        },
      });
    }

    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 30);

    const opportunity = await prisma.opportunity.create({
      data: {
        name: `${lead.company} opportunity`,
        value: lead.value,
        probability: 40,
        stage: "Qualified",
        closeDate,
        customerId: customer.id,
        ownerId: lead.ownerId,
      },
    });

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: "Converted",
        opportunityId: opportunity.id,
        lastContact: new Date(),
      },
    });

    res.json({ lead: updatedLead, opportunity, customer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to convert lead" });
  }
});

// Update Lead
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, company, email, source, value, status, lastContact } = req.body;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(company !== undefined && { company }),
        ...(email !== undefined && { email }),
        ...(source !== undefined && { source }),
        ...(value !== undefined && { value }),
        ...(status !== undefined && { status }),
        ...(lastContact !== undefined && { lastContact: lastContact ? new Date(lastContact) : null }),
      },
    });
    res.json(lead);
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.status(500).json({ error: "Failed to update lead" });
  }
});

// Delete Lead
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lead.delete({
      where: { id },
    });
    res.status(204).send();
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Lead not found" });
    }
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

export default router;
