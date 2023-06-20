-- CreateTable
CREATE TABLE "Meeting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "meetingRoomId" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    CONSTRAINT "Meeting_meetingRoomId_fkey" FOREIGN KEY ("meetingRoomId") REFERENCES "MeetingRoom" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingRoom" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "location" INTEGER NOT NULL,
    "floor" INTEGER NOT NULL,
    "size" TEXT NOT NULL
);
