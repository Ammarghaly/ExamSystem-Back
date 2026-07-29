export const checkGroupMembership = (group, user) => {
  if (!user || !group) return false;

  const userId = user._id || user.id || user;
  const userRole = user.role;

  if (
    userRole === "INSTITUTION_ADMIN" &&
    user.organizationId &&
    group.organizationId &&
    (user.organizationId._id || user.organizationId).toString() ===
      (group.organizationId._id || group.organizationId).toString()
  ) {
    return true;
  }

  const isStudent =
    group.students &&
    group.students.some(
      (student) => (student._id || student).toString() === userId.toString(),
    );

  const isTeacher =
    group.teacher &&
    (group.teacher._id || group.teacher).toString() === userId.toString();

  return Boolean(isStudent || isTeacher);
};
