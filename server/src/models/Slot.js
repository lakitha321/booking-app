import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema(
  {
    model: { type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Helpful index (optional)
SlotSchema.index({ model: 1, startDateTime: 1, endDateTime: 1 });

export default mongoose.model("Slot", SlotSchema);
