import mongoose from "mongoose";

const ModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    nic: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

ModelSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Model", ModelSchema);
