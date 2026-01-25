import mongoose from "mongoose";

const SizeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

SizeSchema.index({ name: 1 }, { unique: true });

export default mongoose.model("Size", SizeSchema);
