-- CreateTable
CREATE TABLE "knowledge_entry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_setting" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "systemPrompt" TEXT NOT NULL DEFAULT 'Anda adalah admin customer service yang ramah dan informatif. Jawab pertanyaan customer dengan singkat, sopan, dan akurat berdasarkan informasi yang tersedia. Kalau tidak tahu jawaban, bilang akan dihubungkan ke admin manusia.',
    "model" TEXT NOT NULL DEFAULT 'llama-3.3-70b-versatile',
    "replyDelayMs" INTEGER NOT NULL DEFAULT 1500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "knowledge_entry_organizationId_idx" ON "knowledge_entry"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_setting_organizationId_key" ON "ai_setting"("organizationId");

-- AddForeignKey
ALTER TABLE "knowledge_entry" ADD CONSTRAINT "knowledge_entry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_setting" ADD CONSTRAINT "ai_setting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
