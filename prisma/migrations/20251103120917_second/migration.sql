-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('AC', 'FAN', 'CYLINDER');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "complaintDescription" TEXT,
ADD COLUMN     "complaintType" "ComplaintType";

-- AlterTable
ALTER TABLE "Technician" ADD COLUMN     "specialty" "ComplaintType";
