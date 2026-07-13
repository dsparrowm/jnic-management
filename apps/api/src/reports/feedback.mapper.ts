import { Prisma } from "@repo/database";

const feedbackInclude = {
  fromUser: { select: { id: true, name: true } },
  toUser: { select: { id: true, name: true } },
} satisfies Prisma.FeedbackInclude;

export type FeedbackWithUsers = Prisma.FeedbackGetPayload<{
  include: typeof feedbackInclude;
}>;

export function toFeedbackView(feedback: FeedbackWithUsers) {
  return {
    id: feedback.id,
    reportId: feedback.reportId,
    message: feedback.message,
    createdAt: feedback.createdAt.toISOString(),
    fromUser: feedback.fromUser,
    toUser: feedback.toUser,
  };
}
