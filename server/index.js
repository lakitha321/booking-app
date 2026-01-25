import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import slotsRouter from "./src/routes/slots.js";
import modelsRouter from "./src/routes/models.js";
import authRouter from "./src/routes/auth.js";
import reservationsRouter from "./src/routes/reservations.js";
import sizesRouter from "./src/routes/sizes.js";
import Reservation from "./src/models/Reservation.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_, res) => res.json({ ok: true }));

app.use("/api/slots", slotsRouter);
app.use("/api/models", modelsRouter);
app.use("/api/auth", authRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/sizes", sizesRouter);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongo connected");
    const reservationIndexes = await Reservation.collection.indexes();
    const droppableIndexes = reservationIndexes.filter(
      (index) => index.unique && index.name !== "_id_"
    );
    if (droppableIndexes.length) {
      await Promise.all(
        droppableIndexes.map(async (index) => {
          await Reservation.collection.dropIndex(index.name);
          console.log(`✅ Dropped reservation index: ${index.name}`);
        })
      );
    }
    app.listen(PORT, () => console.log(`✅ Server running on ${PORT}`));
  } catch (e) {
    console.error("❌ Failed to start:", e);
    process.exit(1);
  }
}
start();
