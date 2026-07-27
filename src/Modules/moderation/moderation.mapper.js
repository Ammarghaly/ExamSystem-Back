export const mapIncident = (incident) => {
  if (!incident) return null;

  const senderObj =
    incident.senderId && typeof incident.senderId === "object"
      ? incident.senderId
      : null;

  const groupObj =
    incident.groupId && typeof incident.groupId === "object"
      ? incident.groupId
      : null;

  return {
    id: incident._id || incident.id,
    sender: senderObj
      ? {
          id: senderObj._id || senderObj.id,
          name: senderObj.name || "Member",
          role: senderObj.role || "Student",
          avatar: senderObj.avatar || "",
        }
      : {
          id: incident.senderId || "",
          name: "Member",
          role: "Student",
          avatar: "",
        },
    group: groupObj
      ? {
          id: groupObj._id || groupObj.id,
          groupName: groupObj.groupName || groupObj.subject || "Group",
        }
      : {
          id: incident.groupId || "",
          groupName: "Group",
        },
    message: incident.message,
    decision: incident.decision,
    code: incident.code,
    category: incident.category,
    severity: incident.severity,
    reason: incident.reason,
    createdAt: incident.createdAt,
    updatedAt: incident.updatedAt,
  };
};

export const mapIncidents = (incidents) => {
  if (!Array.isArray(incidents)) return [];
  return incidents.map(mapIncident);
};
