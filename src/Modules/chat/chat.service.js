import ContentModel from "../../DB/model/messages.js";
import successResponse from "../../Utlis/successRespone.utlis.js";
import GroupModel from "../../DB/model/group.model.js";
import { checkGroupMembership } from "../../Utlis/checkGroupMembership.js";
import AppError from "../../Utlis/appError.js";
import { mapMessage, mapMessages } from "./chat.mapper.js";

export const validateGroupAccess = async (groupId, userId) => {
  const group = await GroupModel.findById(groupId);
  if (!group) {
    throw new AppError("Group not found", 404);
  }

  if (!checkGroupMembership(group, userId)) {
    throw new AppError("User is not a member of this group", 403);
  }

  return group;
};

export const createMessageService = async ({
  groupId,
  content,
  senderId,
  senderType,
}) => {
  const message = await ContentModel.create({
    groupId,
    content,
    senderId,
    senderType,
  });

  const populatedMessage = await message.populate({
    path: "senderId",
    select: "name role avatar",
  });

  return mapMessage(populatedMessage);
};

export const updateLastSeenService = async ({ groupId, userId, messageId }) => {
  const group = await validateGroupAccess(groupId, userId);
  const currentMessage = await ContentModel.findById(messageId);
  if (!currentMessage) {
    throw new AppError("Message not found", 404);
  }
  if (currentMessage.groupId.toString() !== groupId.toString()) {
    throw new AppError("Message does not belong to this group", 400);
  }
  const index = group.lastSeen.findIndex(
    (item) => item.userId.toString() === userId.toString(),
  );

  const seenAt = new Date();

  if (index === -1) {
    group.lastSeen.push({
      userId,
      messageId,
      seenAt,
    });
    await group.save();
    return group.lastSeen[group.lastSeen.length - 1];
  }
  const oldMessage = await ContentModel.findById(
    group.lastSeen[index].messageId,
  );

  const updateLastSeen = async () => {
    group.lastSeen[index].messageId = messageId;
    group.lastSeen[index].seenAt = seenAt;

    await group.save();

    return group.lastSeen[index];
  };

  if (!oldMessage) {
    return updateLastSeen();
  }
  if (currentMessage.createdAt > oldMessage.createdAt) {
    return updateLastSeen();
  }
  return null;
};

export const createMessage = async (req, res, next) => {
  const { content, groupId } = req.body;
  const senderId = req.user.id;
  const senderType = req.user.role;

  await validateGroupAccess(groupId, senderId);

  const message = await createMessageService({
    groupId,
    content,
    senderId,
    senderType,
  });

  return successResponse({
    res,
    statusCode: 201,
    message: "Message created successfully",
    data: message,
  });
};

export const getMessagesByGroupId = async (req, res, next) => {
  const senderId = req.user.id;
  const { groupId } = req.params;

  await validateGroupAccess(groupId, senderId);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const messages = await ContentModel.find({ groupId })
    .select("-__v")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: "senderId",
      select: "name role avatar",
    })
    .lean();

  return successResponse({
    res,
    statusCode: 200,
    message: "Messages retrieved successfully",
    data: mapMessages(messages),
  });
};
