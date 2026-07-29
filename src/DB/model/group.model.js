import mongoose, { Schema } from "mongoose";

const GroupSchema = new Schema(
  {
    groupName: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    accessCode: {
      type: String,
      required: true,
      unique: true,
    },

    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    pendingStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    rejectedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastSeen: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        messageId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Content",
          required: true,
        },
        seenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const GroupModel =
  mongoose.models.Group || mongoose.model("Group", GroupSchema);

export default GroupModel;
