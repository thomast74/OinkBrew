-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "connectedDevices" JSONB,
ADD COLUMN     "firmwareVersion" DOUBLE PRECISION,
ADD COLUMN     "shieldVersion" INTEGER;
