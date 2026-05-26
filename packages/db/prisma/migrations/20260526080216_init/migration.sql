/*
  Warnings:

  - You are about to drop the column `invitedById` on the `invitation` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `invitation` table. All the data in the column will be lost.
  - The `role` column on the `invitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `industry` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `organization` table. All the data in the column will be lost.
  - You are about to drop the `membership` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `inviterId` to the `invitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_invitedById_fkey";

-- DropForeignKey
ALTER TABLE "membership" DROP CONSTRAINT "membership_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "membership" DROP CONSTRAINT "membership_userId_fkey";

-- DropIndex
DROP INDEX "invitation_token_key";

-- AlterTable
ALTER TABLE "invitation" DROP COLUMN "invitedById",
DROP COLUMN "token",
ADD COLUMN     "inviterId" TEXT NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "organization" DROP COLUMN "industry",
DROP COLUMN "updatedAt",
ADD COLUMN     "metadata" TEXT;

-- DropTable
DROP TABLE "membership";

-- DropEnum
DROP TYPE "OrgRole";

-- CreateTable
CREATE TABLE "member" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_userId_idx" ON "member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "member_organizationId_userId_key" ON "member"("organizationId", "userId");

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
