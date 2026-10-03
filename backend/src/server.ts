import express from "express";
import cors from "cors";
import leadsRouter from "./routes/leads";

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

app.listen(PORT, () => {
  console.log(`NEXORA backend running on http://localhost:${PORT}`);
});