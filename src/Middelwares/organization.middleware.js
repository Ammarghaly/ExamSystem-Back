export const requireInstitutionAdmin = (req, res, next) => {
  if (req.user.role !== "INSTITUTION_ADMIN") {
    return next(
      new Error("Access denied. Institution Admin role required.", {
        cause: 403,
      }),
    );
  }
  if (!req.user.organizationId) {
    return next(
      new Error("No organization linked to this account.", { cause: 400 }),
    );
  }
  return next();
};

export const requireOrganizationMember = (req, res, next) => {
  if (
    req.user.role !== "INSTITUTION_ADMIN" &&
    req.user.role !== "INSTITUTION_MEMBER"
  ) {
    return next(
      new Error("Access denied. Organization membership required.", {
        cause: 403,
      }),
    );
  }
  return next();
};

export const attachOrganizationId = (req, res, next) => {
  if (
    req.user.organizationId &&
    (req.user.role === "INSTITUTION_MEMBER" ||
      req.user.role === "INSTITUTION_ADMIN")
  ) {
    req.body.organizationId =
      req.user.organizationId._id || req.user.organizationId;
  }
  return next();
};
