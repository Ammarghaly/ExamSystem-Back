export const mapMessage = (message) => ({
  id: message._id,
  groupId: message.groupId,
  content: message.content,
  messageType: message.messageType,
  isEdited: message.isEdited,
  attachments: message.attachments,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,

  sender: {
    id: message.senderId._id,
    name: message.senderId.name,
    role: message.senderId.role,
    avatar: message.senderId.avatar,
  },
});

export const mapMessages = (messages) => messages.map(mapMessage);
