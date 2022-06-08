/*
  Warnings:

  - You are about to drop the column `isFavorite` on the `YoutubeChannel` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `YoutubeChannel` table. All the data in the column will be lost.
  - Added the required column `status` to the `UserOnYoutubeChannel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserOnYoutubeChannel" ADD COLUMN     "isFavorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "Status" NOT NULL;

-- AlterTable
ALTER TABLE "YoutubeChannel" DROP COLUMN "isFavorite",
DROP COLUMN "status";
