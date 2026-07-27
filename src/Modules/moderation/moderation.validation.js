import Joi from "joi";

export const createMessageValidation = Joi.object({
  groupId: Joi.string().required(),
  content: Joi.string().required(),
});

export const getIncidentsSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    groupId: Joi.string().hex().length(24),
    decision: Joi.string().valid("WARN", "BLOCK"),
    severity: Joi.string().valid("low", "medium", "high"),
    category: Joi.string().valid(
      "off_topic",
      "profanity",
      "harassment",
      "hate_speech",
      "threat",
      "sexual_content",
      "violence",
      "spam",
    ),
  }),
};

export const getIncidentByIdSchema = {
  params: Joi.object({
    id: Joi.string().hex().length(24).required(),
  }),
};
