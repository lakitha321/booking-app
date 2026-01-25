import mongoose from "mongoose";

const ModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    size: { type: mongoose.Schema.Types.ObjectId, ref: "Size", required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

ModelSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Model", ModelSchema);
