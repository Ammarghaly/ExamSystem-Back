export const mapMessage = (message) => ({
  id: message._id,
  groupId: message.groupId,
  content: message.content,
  messageType: message.messageType,
  isEdited: message.isEdited,
  attachments: message.attachments,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,

  sender: message.senderId && typeof message.senderId === 'object'
    ? {
        id: message.senderId._id || message.senderId.id,
        name: message.senderId.name || "Member",
        role: message.senderId.role || "Student",
        avatar: message.senderId.avatar || "",
      }
    : {
        id: message.senderId || "",
        name: "Member",
        role: "Student",
        avatar: "",
      },
});

export const mapMessages = (messages) => messages.map(mapMessage);
