-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "last_ip_address" TEXT NOT NULL,
    "last_heard" TIMESTAMP(3) NOT NULL,
    "last_handshake_at" TIMESTAMP(3) NOT NULL,
    "product_id" INTEGER NOT NULL,
    "online" BOOLEAN NOT NULL,
    "connected" BOOLEAN NOT NULL,
    "platform_id" INTEGER NOT NULL,
    "cellular" BOOLEAN NOT NULL,
    "notes" TEXT,
    "firmware_updates_enabled" BOOLEAN NOT NULL,
    "firmware_updates_forced" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "system_firmware_version" TEXT NOT NULL,
    "current_build_target" TEXT NOT NULL,
    "pinned_build_target" TEXT,
    "default_build_target" TEXT NOT NULL,
    "functions" TEXT[],
    "variables" JSONB,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);
