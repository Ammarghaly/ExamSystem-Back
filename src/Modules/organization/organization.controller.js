import express from "express";
import { authentication } from "../../Middelwares/auth.middlewares.js";
import { requireInstitutionAdmin } from "../../Middelwares/organization.middleware.js";
import {
  createSubAccount,
  getSubAccounts,
  toggleSubAccountStatus,
  resetSubAccountPassword,
  getOrgDashboard,
  getOrgExams,
  getOrgGroups,
  getOrgModeration,
  updateOrgProfile,
} from "./organization.service.js";

const router = express.Router();
router.post(
  "/sub-accounts",
  authentication,
  requireInstitutionAdmin,
  createSubAccount,
);
router.get(
  "/sub-accounts",
  authentication,
  requireInstitutionAdmin,
  getSubAccounts,
);
router.patch(
  "/sub-accounts/:userId/toggle-status",
  authentication,
  requireInstitutionAdmin,
  toggleSubAccountStatus,
);
router.patch(
  "/sub-accounts/:userId/reset-password",
  authentication,
  requireInstitutionAdmin,
  resetSubAccountPassword,
);
router.get(
  "/dashboard",
  authentication,
  requireInstitutionAdmin,
  getOrgDashboard,
);
router.get("/exams", authentication, requireInstitutionAdmin, getOrgExams);
router.get("/groups", authentication, requireInstitutionAdmin, getOrgGroups);
router.get(
  "/moderation",
  authentication,
  requireInstitutionAdmin,
  getOrgModeration,
);
router.patch(
  "/profile",
  authentication,
  requireInstitutionAdmin,
  updateOrgProfile,
);
export default router;
