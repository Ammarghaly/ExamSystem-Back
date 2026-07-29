import OrganizationModel from "../DB/model/organization.model.js";
import UserModel from "../DB/model/user.model.js";
import GroupModel from "../DB/model/group.model.js";
import ExamModel from "../DB/model/exam.model.js";

/**
 * Setup or migrate an Institution for a user upgrading to INSTITUTION_ADMIN.
 * Creates Organization, Primary Teacher Sub-Account, and transfers existing groups & exams seamlessly.
 */
export const setupInstitutionForUser = async (user) => {
  if (!user || user.role === "INSTITUTION_MEMBER") return user;

  const rawUsername = (user.email || "teacher")
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const domainName = rawUsername || "org";

  // 1. Find or create Organization
  let org = await OrganizationModel.findOne({ ownerId: user._id });
  if (!org) {
    org = await OrganizationModel.create({
      name: `${user.name}'s Organization`,
      ownerId: user._id,
      domain: domainName,
      totalCredits: 10000,
      usedCredits: 0,
      subscription_type: "institution",
      status: "active",
    });
  }

  // 2. Set Admin role and organizationId
  user.role = "INSTITUTION_ADMIN";
  user.organizationId = org._id;
  user.subscription_type = "institution";
  await user.save();

  // 3. Find or create Primary Teacher Sub-Account for the Admin
  let primarySub = await UserModel.findOne({
    organizationId: org._id,
    createdBy: user._id,
    role: "INSTITUTION_MEMBER",
  });

  if (!primarySub) {
    const customUsername = `${rawUsername}.teacher@academix.com`;
    const primarySubEmail = `${rawUsername}.teacher@academix.com`;

    const existing = await UserModel.findOne({ email: primarySubEmail });
    const finalEmail = existing ? `${rawUsername}.teacher@academix.com` : primarySubEmail;

    if (existing) {
      primarySub = existing;
      primarySub.organizationId = org._id;
      primarySub.role = "INSTITUTION_MEMBER";
      primarySub.isActive = true;
      await primarySub.save();
    } else {
      primarySub = await UserModel.create({
        role: "INSTITUTION_MEMBER",
        name: user.name,
        email: finalEmail,
        password: user.password,
        avatar: user.avatar,
        subjects_taught: user.subjects_taught || "",
        organizationId: org._id,
        customUsername,
        createdBy: user._id,
        subscription_type: "institution",
        available_credits: 0,
        subscription_credits: 0,
        purchased_credits: 0,
        otp: { verified: true },
        isActive: true,
      });
    }
  }

  // 4. Transfer existing Groups and Exams created by the Admin to the Primary Sub-Account
  await GroupModel.updateMany(
    { teacher: user._id },
    { teacher: primarySub._id, organizationId: org._id }
  );

  await ExamModel.updateMany(
    { teacherID: user._id },
    { teacherID: primarySub._id, organizationId: org._id }
  );

  // 5. Ensure any groups/exams owned by primarySub have organizationId set
  await GroupModel.updateMany(
    { teacher: primarySub._id, organizationId: null },
    { organizationId: org._id }
  );

  await ExamModel.updateMany(
    { teacherID: primarySub._id, organizationId: null },
    { organizationId: org._id }
  );

  return user;
};
