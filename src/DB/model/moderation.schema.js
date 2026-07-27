import mongoose, { Schema, Types } from "mongoose";

const moderationSchema = new Schema(
  {
    senderId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },

    groupId: {
      type: Types.ObjectId,
      ref: "Group",
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    decision: {
      type: String,
      enum: ["WARN", "BLOCK"],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "off_topic",
        "profanity",
        "harassment",
        "hate_speech",
        "threat",
        "sexual_content",
        "violence",
        "spam",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Moderation", moderationSchema);
