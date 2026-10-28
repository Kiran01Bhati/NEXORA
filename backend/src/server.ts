import express from "express";
import cors from "cors";
import leadsRouter from "./routes/leads";
import opportunitiesRouter from "./routes/opportunities";
import quotationsRouter from "./routes/quotations";
import salesOrdersRouter from "./routes/salesOrders";
import invoicesRouter from "./routes/invoices";
import paymentsRouter from "./routes/payments";
import accountingRouter from "./routes/accounting";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "NEXORA backend is running",
  });
});

app.use("/api/leads", leadsRouter);
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/quotations", quotationsRouter);
app.use("/api/orders", salesOrdersRouter);
app.use("/api/sales-orders", salesOrdersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/accounting", accountingRouter);

app.listen(PORT, () => {
  console.log(`NEXORA backend running on http://localhost:${PORT}`);
});