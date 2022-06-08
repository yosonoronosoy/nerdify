/*
  Warnings:

  - You are about to drop the column `status` on the `UserOnYoutubeChannel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserOnYoutubeChannel" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "YoutubeChannel" ADD COLUMN     "status" "Status" NOT NULL DEFAULT E'UNPROCESSED';
