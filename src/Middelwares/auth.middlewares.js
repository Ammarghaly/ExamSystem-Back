import { verifyTokin } from "../Utlis/token.utlis.js";
import UserModel from "../DB/model/user.model.js";
import { setupInstitutionForUser } from "../Utlis/institution.utlis.js";

export const authentication = async (req, res, next) => {
  let token = req.headers.authorization || req.cookies.accessToken;

  if (!token) {
    return next(new Error("Token required!", { cause: 401 }));
  }

  // Remove "Bearer " prefix if exists
  if (token.startsWith("Bearer ")) {
    token = token.slice(7);
  }

  try {
    const decoded = verifyTokin({ token });

    const userId = decoded._id || decoded.id;
    let user = await UserModel.findById(userId).populate("organizationId");

    if (!user) {
      return next(new Error("User Not Found", { cause: 404 }));
    }

    if (
      user.subscription_type === "institution" &&
      user.role !== "INSTITUTION_MEMBER" &&
      (!user.organizationId || user.role !== "INSTITUTION_ADMIN")
    ) {
      await setupInstitutionForUser(user);
      user = await UserModel.findById(userId).populate("organizationId");
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(new Error("Invalid Token", { cause: 401 }));
  }
};

export const authorization = ({ role = [] }) => {
  return async (req, res, next) => {
    if (req.user.isActive === false) {
      return next(
        new Error("Account is disabled. Contact your administrator.", {
          cause: 403,
        }),
      );
    }
    const effectiveRole =
      req.user.role === "INSTITUTION_MEMBER" || req.user.role === "INSTITUTION_ADMIN"
        ? "Teacher"
        : req.user.role;

    if (!role.includes(req.user.role) && !role.includes(effectiveRole)) {
      return next(new Error("Unauthorized", { cause: 403 }));
    }
    return next();
  };
};
