-- CreateTable
CREATE TABLE "whatsapp_account" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "phoneNumberId" TEXT NOT NULL,
    "displayPhoneNumber" TEXT NOT NULL,
    "verifiedName" TEXT,
    "businessAccountId" TEXT,
    "accessToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "whatsappAccountId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "waMessageId" TEXT,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "body" TEXT,
    "mediaUrl" TEXT,
    "raw" JSONB,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_account_phoneNumberId_key" ON "whatsapp_account"("phoneNumberId");

-- CreateIndex
CREATE INDEX "whatsapp_account_organizationId_idx" ON "whatsapp_account"("organizationId");

-- CreateIndex
CREATE INDEX "conversation_organizationId_lastMessageAt_idx" ON "conversation"("organizationId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_whatsappAccountId_customerPhone_key" ON "conversation"("whatsappAccountId", "customerPhone");

-- CreateIndex
CREATE UNIQUE INDEX "message_waMessageId_key" ON "message"("waMessageId");

-- CreateIndex
CREATE INDEX "message_conversationId_createdAt_idx" ON "message"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "whatsapp_account" ADD CONSTRAINT "whatsapp_account_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation" ADD CONSTRAINT "conversation_whatsappAccountId_fkey" FOREIGN KEY ("whatsappAccountId") REFERENCES "whatsapp_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
