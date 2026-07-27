import express from "express";
import successResponse from "../../Utlis/successRespone.utlis.js";
import { authentication, authorization } from "../../Middelwares/auth.middlewares.js";
import { validation } from "../../Middelwares/validation.middelwares.js";
import {
  getIncidentsSchema,
  getIncidentByIdSchema,
} from "./moderation.validation.js";
import {
  getIncidentsService,
  getIncidentByIdService,
} from "./moderation.service.js";

const router = express.Router();

export const getIncidents = async (req, res, next) => {
  try {
    const { page, limit, groupId, decision, severity, category } = req.query;

    const data = await getIncidentsService({
      page,
      limit,
      groupId,
      decision,
      severity,
      category,
    });

    return successResponse({
      res,
      statusCode: 200,
      message: "Incidents retrieved successfully",
      data,
    });
  } catch (err) {
    return next(err);
  }
};

export const getIncidentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await getIncidentByIdService(id);

    return successResponse({
      res,
      statusCode: 200,
      message: "Incident details retrieved successfully",
      data,
    });
  } catch (err) {
    return next(err);
  }
};

router.get(
  "/",
  authentication,
  authorization({ role: ["Teacher", "teacher", "Admin", "admin"] }),
  validation(getIncidentsSchema),
  getIncidents,
);

router.get(
  "/:id",
  authentication,
  authorization({ role: ["Teacher", "teacher", "Admin", "admin"] }),
  validation(getIncidentByIdSchema),
  getIncidentById,
);

export default router;
