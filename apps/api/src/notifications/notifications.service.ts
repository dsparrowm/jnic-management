import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, limit = 20) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      this.prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        readAt: item.readAt?.toISOString() ?? null,
        metadata: item.metadata as Record<string, unknown> | null,
        createdAt: item.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException("Notification not found");
    }
    if (notification.readAt) {
      return {
        id: notification.id,
        readAt: notification.readAt.toISOString(),
      };
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return {
      id: updated.id,
      readAt: updated.readAt!.toISOString(),
    };
  }
}
