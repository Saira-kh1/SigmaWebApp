// models/Thread.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  { role: { type: String, enum: ["user","assistant","system"], required: true },
    content: { type: String, required: true },
    at: { type: Date, default: Date.now } },
  { _id: false }
);

const ThreadSchema = new mongoose.Schema(
  {
    threadId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, // ✅
    title: { type: String, default: "" },
    messages: { type: [MessageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// helpful compound index for “my most recent threads”
ThreadSchema.index({ ownerId: 1, updatedAt: -1 });

export default mongoose.model("Thread", ThreadSchema);
