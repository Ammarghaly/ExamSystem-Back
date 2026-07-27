import AppError from "../../Utlis/appError.js";
import moderationSchema from "../../DB/model/moderation.schema.js";
import { checkMessage } from "./moderation.ai.js";
import { mapIncident, mapIncidents } from "./moderation.mapper.js";

const getCategoryArabicName = (cat) => {
  switch (cat) {
    case "profanity":
    case "harassment":
      return "ألفاظ غير لائقة أو إساءة";
    case "hate_speech":
      return "خطاب كراهية";
    case "threat":
      return "تهديدات";
    case "sexual_content":
      return "محتوى غير لائق";
    case "violence":
      return "محتوى عنيف";
    case "spam":
      return "رسائل مزعجة (Spam)";
    case "off_topic":
      return "موضوع خارج نطاق الدراسة";
    default:
      return "محتوى غير ملائم";
  }
};

const buildFallbackReason = (message, moderation) => {
  const isArabic = /[\u0600-\u06FF]/.test(message || "");
  const cat = moderation?.category;

  if (isArabic) {
    return `تم حظر الرسالة لاحتوائها على ${getCategoryArabicName(cat)}.`;
  }
  const categoryName = cat ? cat.replace("_", " ") : "inappropriate content";
  return `Message blocked: Contains ${categoryName}.`;
};

export const moderateMessage = async ({ message }) => {
  const moderationResult = await checkMessage({
    message,
  });

  return moderationResult;
};

export const handleModerationDecision = async ({
  moderationResult,
  senderId,
  groupId,
  message,
}) => {
  const { decision, moderation } = moderationResult;

  const defaultReason = buildFallbackReason(message, moderation);
  const reasonText = moderation?.reason || defaultReason;

  switch (decision) {
    case "ALLOW":
      return;

    case "WARN":
      await createIncidentReport({
        senderId,
        groupId,
        message,
        moderationResult,
      });
      return;

    case "BLOCK":
      await createIncidentReport({
        senderId,
        groupId,
        message,
        moderationResult,
      });

      throw new AppError(reasonText, 403);

    default:
      throw new AppError("Unable to moderate this message.", 500);
  }
};

export const createIncidentReport = async ({
  senderId,
  groupId,
  message,
  moderationResult,
}) => {
  const { decision, moderation } = moderationResult;
  if (decision === "ALLOW") {
    return null;
  }

  const defaultReason = buildFallbackReason(message, moderation);
  const reasonText = moderation?.reason || defaultReason;

  return await moderationSchema.create({
    senderId,
    groupId,
    message,
    decision,
    code: moderation?.code || "PROFANITY",
    category: moderation?.category || "profanity",
    severity: moderation?.severity || "medium",
    reason: reasonText,
  });
};

export const getIncidentsService = async ({
  page = 1,
  limit = 10,
  groupId,
  decision,
  severity,
  category,
}) => {
  const filter = {};
  if (groupId) filter.groupId = groupId;
  if (decision) filter.decision = decision;
  if (severity) filter.severity = severity;
  if (category) filter.category = category;

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const total = await moderationSchema.countDocuments(filter);

  const incidents = await moderationSchema
    .find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate({
      path: "senderId",
      select: "name role avatar",
    })
    .populate({
      path: "groupId",
      select: "groupName subject",
    })
    .lean();

  return {
    incidents: mapIncidents(incidents),
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

export const getIncidentByIdService = async (id) => {
  const incident = await moderationSchema
    .findById(id)
    .populate({
      path: "senderId",
      select: "name role avatar",
    })
    .populate({
      path: "groupId",
      select: "groupName subject",
    })
    .lean();

  if (!incident) {
    throw new AppError("Moderation incident not found", 404);
  }

  return mapIncident(incident);
};
