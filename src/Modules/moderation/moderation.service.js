import { checkMessage } from "./moderation.ai";

export const moderateMessage = async ({ content }) => {
  const moderationResult = await checkMessage({
    message: content,
  });

  return moderationResult;
};
