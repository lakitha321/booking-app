import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    notes: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Helpful index (optional)
SlotSchema.index({ startDateTime: 1, endDateTime: 1 });

export default mongoose.model("Slot", SlotSchema);
