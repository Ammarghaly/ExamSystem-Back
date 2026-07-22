import { z } from "zod";
import { ChatGroq } from "@langchain/groq";
import moderationPrompt from "./moderation.prompt.js";

const ModerationSchema = z.object({
  decision: z.enum(["ALLOW", "WARN", "BLOCK"]),
  moderation: z.object({
    code: z.enum([
      "NONE",
      "OFF_TOPIC",
      "PROFANITY",
      "HARASSMENT",
      "HATE_SPEECH",
      "THREAT",
      "SEXUAL_CONTENT",
      "VIOLENCE",
      "SPAM",
    ]),

    category: z.enum([
      "none",
      "off_topic",
      "profanity",
      "harassment",
      "hate_speech",
      "threat",
      "sexual_content",
      "violence",
      "spam",
    ]),

    severity: z.enum(["low", "medium", "high"]),

    reason: z.string().nullable(),
  }),
});

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0,
});
const moderationModel = model.withStructuredOutput(ModerationSchema);

export const checkMessage = async ({ message, senderId, groupId }) => {
  try {
    const response = await moderationModel.invoke([
      {
        role: "system",
        content: moderationPrompt,
      },
      {
        role: "user",
        content: `Message:\n${message}`,
      },
    ]);

    return response;
  } catch (error) {
    console.error("Moderation Error:", error);

    return {
      decision: "ALLOW",
      moderation: {
        code: "NONE",
        category: "none",
        severity: "low",
        reason: null,
      },
    };
  }
};
