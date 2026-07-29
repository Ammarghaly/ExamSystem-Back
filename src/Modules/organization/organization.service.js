import UserModel from "../../DB/model/user.model.js";
import OrganizationModel from "../../DB/model/organization.model.js";
import ExamModel from "../../DB/model/exam.model.js";
import GroupModel from "../../DB/model/group.model.js";
import ModerationModel from "../../DB/model/moderation.schema.js";
import ExamAttemptModel from "../../DB/model/examAttempt.model.js";
import { hashPassword } from "../../Utlis/hash.utlis.js";
import successResponse from "../../Utlis/successRespone.utlis.js";

export const createSubAccount = async (req, res, next) => {
  try {
    const { name, email, username, password, subjects_taught } = req.body;
    const adminUser = req.user;
    const orgId = adminUser.organizationId._id || adminUser.organizationId;

    const org = await OrganizationModel.findById(orgId);
    if (!org) return next(new Error("Organization not found", { cause: 404 }));

    const inputUser = (username || email || "").trim();
    if (!inputUser) {
      return next(new Error("Username or Email is required", { cause: 400 }));
    }

    const rawUsername = inputUser
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "");

    const orgDomain = (org.domain || org.name || "acdemix")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const generatedAddress = `${rawUsername}.${orgDomain}@acdemix.com`;

    const finalEmail =
      email && email.includes("@")
        ? email.trim().toLowerCase()
        : generatedAddress;

    const customUsername = generatedAddress;

    const existingUser = await UserModel.findOne({
      $or: [{ email: finalEmail }, { customUsername }],
    });
    if (existingUser) {
      return next(
        new Error("Sub-account with this username/email already exists", {
          cause: 400,
        }),
      );
    }

    const currentMemberCount = await UserModel.countDocuments({
      organizationId: orgId,
      role: "INSTITUTION_MEMBER",
    });
    if (currentMemberCount >= org.baseAccountLimit) {
      if (org.remainingCredits < org.extraAccountFeeCredits) {
        return next(
          new Error(
            `Insufficient credits. Extra accounts cost ${org.extraAccountFeeCredits} credits. Available: ${org.remainingCredits}`,
            { cause: 402 },
          ),
        );
      }
      org.usedCredits += org.extraAccountFeeCredits;
      await org.save();
    }

    const hashedPassword = await hashPassword({ plainText: password });

    const newUser = await UserModel.create({
      role: "INSTITUTION_MEMBER",
      name,
      email: finalEmail,
      password: hashedPassword,
      subjects_taught: subjects_taught || "",
      organizationId: orgId,
      customUsername,
      createdBy: adminUser._id,
      subscription_type: "institution",
      available_credits: 0,
      subscription_credits: 0,
      purchased_credits: 0,
      otp: { verified: true },
      isActive: true,
    });
    return successResponse({
      res,
      statusCode: 201,
      message: "Sub-account created successfully",
      data: {
        user: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          customUsername: newUser.customUsername,
          role: newUser.role,
          isActive: newUser.isActive,
        },
        totalMembers: currentMemberCount + 1,
        isExtraAccount: currentMemberCount >= org.baseAccountLimit,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getSubAccounts = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const members = await UserModel.find({
      organizationId: orgId,
      role: "INSTITUTION_MEMBER",
    }).select("name email customUsername avatar isActive createdAt");
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const examCount = await ExamModel.countDocuments({
          teacherID: member._id,
        });
        const exams = await ExamModel.find({
          teacherID: member._id,
        });
        const creditsUsed = exams.reduce(
          (sum, exam) => sum + (exam.numOfQuestion || 0),
          0,
        );
        return {
          ...member.toObject(),
          monthlyExamCount: examCount,
          monthlyCreditsUsed: creditsUsed,
        };
      }),
    );
    return successResponse({
      res,
      statusCode: 200,
      message: "Sub-accounts retrieved",
      data: membersWithStats,
    });
  } catch (error) {
    return next(error);
  }
};

export const toggleSubAccountStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const user = await UserModel.findOne({
      _id: userId,
      organizationId: orgId,
      role: "INSTITUTION_MEMBER",
    });
    if (!user) return next(new Error("User not found", { cause: 404 }));
    const newStatus = !user.isActive;
    await UserModel.findByIdAndUpdate(userId, { isActive: newStatus });
    return successResponse({
      res,
      statusCode: 200,
      message: `Account ${newStatus ? "activated" : "disabled"} successfully`,
      data: { userId: user._id, isActive: newStatus },
    });
  } catch (error) {
    return next(error);
  }
};

export const resetSubAccountPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const orgId = req.user.organizationId._id || req.user.organizationId;
    if (!newPassword || newPassword.length < 6) {
      return next(
        new Error("Password must be at least 6 characters", { cause: 400 }),
      );
    }
    const user = await UserModel.findOne({
      _id: userId,
      organizationId: orgId,
      role: "INSTITUTION_MEMBER",
    });
    if (!user) return next(new Error("User not found", { cause: 404 }));
    const hashedPassword = await hashPassword({ plainText: newPassword });
    await UserModel.findByIdAndUpdate(userId, { password: hashedPassword });
    return successResponse({
      res,
      statusCode: 200,
      message: "Password reset successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrgDashboard = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const org = await OrganizationModel.findById(orgId);
    if (!org) return next(new Error("Organization not found", { cause: 404 }));
    const totalMembers = await UserModel.countDocuments({
      organizationId: orgId,
      role: "INSTITUTION_MEMBER",
    });
    const totalExams = await ExamModel.countDocuments({
      organizationId: orgId,
    });
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyExams = await ExamModel.find({
      organizationId: orgId,
      createdAt: { $gte: startOfMonth },
    });
    const monthlyCreditsUsed = monthlyExams.reduce(
      (sum, exam) => sum + (exam.numOfQuestion || 0),
      0,
    );

    const totalIncidents = await ModerationModel.countDocuments({
      organizationId: orgId,
    });

    const allExamIds = (
      await ExamModel.find({ organizationId: orgId }).select("_id")
    ).map((e) => e._id);
    const attempts = await ExamAttemptModel.find({
      examID: { $in: allExamIds },
      endTime: { $exists: true, $ne: null },
    });
    let averageCohortScore = 0;
    if (attempts.length > 0) {
      const totalScoreSum = attempts.reduce(
        (sum, a) => sum + (a.totalScore || 0),
        0,
      );
      averageCohortScore = Number(
        ((totalScoreSum / attempts.length) * 10).toFixed(1),
      );
    }
    return successResponse({
      res,
      statusCode: 200,
      message: "Organization dashboard data",
      data: {
        organization: {
          name: org.name,
          domain: org.domain,
          totalCredits: org.totalCredits,
          usedCredits: org.usedCredits,
          remainingCredits: org.remainingCredits,
          baseAccountLimit: org.baseAccountLimit,
          subscription_type: org.subscription_type,
          subscription_expires_at: org.subscription_expires_at,
        },
        stats: {
          totalMembers,
          totalExams,
          monthlyCreditsUsed,
          totalIncidents,
          averageCohortScore,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrgExams = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const orgMembers = await UserModel.find({ organizationId: orgId }).select("_id");
    const memberIds = orgMembers.map((m) => m._id);

    const exams = await ExamModel.find({
      $or: [{ organizationId: orgId }, { teacherID: { $in: memberIds } }],
    })
      .populate("teacherID", "name email customUsername avatar")
      .populate("groupID", "groupName subject")
      .sort({ createdAt: -1 });

    return successResponse({
      res,
      statusCode: 200,
      message: "Organization exams retrieved",
      data: exams,
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrgGroups = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const orgMembers = await UserModel.find({ organizationId: orgId }).select("_id");
    const memberIds = orgMembers.map((m) => m._id);

    const groups = await GroupModel.find({
      $or: [{ organizationId: orgId }, { teacher: { $in: memberIds } }],
    })
      .populate("teacher", "name email customUsername avatar")
      .sort({ createdAt: -1 });

    return successResponse({
      res,
      statusCode: 200,
      message: "Organization groups retrieved",
      data: groups,
    });
  } catch (error) {
    return next(error);
  }
};

export const getOrgModeration = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const {
      page = 1,
      limit = 50,
      severity,
      category,
      decision,
      teacherId,
      groupId,
    } = req.query;

    const groupFilter = { organizationId: orgId };
    if (teacherId) {
      groupFilter.teacher = teacherId;
    }
    if (groupId) {
      groupFilter._id = groupId;
    }

    const orgGroups = await GroupModel.find(groupFilter).select("_id");
    const orgGroupIds = orgGroups.map((g) => g._id);

    const filter = {
      $or: [{ organizationId: orgId }, { groupId: { $in: orgGroupIds } }],
    };

    if (teacherId || groupId) {
      delete filter.$or;
      filter.groupId = { $in: orgGroupIds };
    }

    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (decision) filter.decision = decision;

    const total = await ModerationModel.countDocuments(filter);
    const incidents = await ModerationModel.find(filter)
      .populate("senderId", "name email avatar role")
      .populate({
        path: "groupId",
        select: "groupName subject teacher",
        populate: { path: "teacher", select: "name email customUsername avatar" },
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return successResponse({
      res,
      statusCode: 200,
      message: "Organization moderation incidents",
      data: {
        incidents,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const updateOrgProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return next(new Error("Organization name is required", { cause: 400 }));
    }
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const org = await OrganizationModel.findById(orgId);
    if (!org) return next(new Error("Organization not found", { cause: 404 }));

    const cleanName = name.trim();
    org.name = cleanName;
    org.domain = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "") || "acdemix";
    await org.save();

    return successResponse({
      res,
      statusCode: 200,
      message: "Organization profile updated successfully",
      data: org,
    });
  } catch (error) {
    return next(error);
  }
};
