import mongoose, { Schema } from "mongoose";

const OrganizationSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [100, "Name must be at most 100 characters"],
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    domain: {
      type: String,
      required: [true, "Domain is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    totalCredits: {
      type: Number,
      default: 0,
    },
    usedCredits: {
      type: Number,
      default: 0,
    },
    baseAccountLimit: {
      type: Number,
      default: 10,
    },
    extraAccountFeeCredits: {
      type: Number,
      default: 20,
    },
    subscription_type: {
      type: String,
      enum: ["basic", "professional", "enterprise"],
      default: "basic",
    },
    subscription_expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ["active", "suspended", "expired"],
      default: "active",
    },

    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null },
  },
  {
    timestamps: true,
  },
);
OrganizationSchema.virtual("remainingCredits").get(function () {
  return this.totalCredits - this.usedCredits;
});
OrganizationSchema.set("toJSON", { virtuals: true });
OrganizationSchema.set("toObject", { virtuals: true });

const OrganizationModel =
  mongoose.models.Organization ||
  mongoose.model("Organization", OrganizationSchema);

export default OrganizationModel;
