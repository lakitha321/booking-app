import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import slotsRouter from "./src/routes/slots.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use("/api/slots", slotsRouter);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongo connected");
    app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
  } catch (e) {
    console.error("❌ Failed to start:", e);
    process.exit(1);
  }
}
start();
