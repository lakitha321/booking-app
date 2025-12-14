import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    model: { type: mongoose.Schema.Types.ObjectId, ref: "Model", required: true },
    slot: { type: mongoose.Schema.Types.ObjectId, ref: "Slot", required: true },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

ReservationSchema.index({ slot: 1 }, { unique: true });
ReservationSchema.index({ user: 1, startDateTime: 1 });

export default mongoose.model("Reservation", ReservationSchema);
