-- CreateTable
CREATE TABLE "ChatMessageReceipt" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),

    CONSTRAINT "ChatMessageReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatMessageReceipt_userId_readAt_idx" ON "ChatMessageReceipt"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ChatMessageReceipt_messageId_idx" ON "ChatMessageReceipt"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessageReceipt_messageId_userId_key" ON "ChatMessageReceipt"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "ChatMessageReceipt" ADD CONSTRAINT "ChatMessageReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageReceipt" ADD CONSTRAINT "ChatMessageReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
