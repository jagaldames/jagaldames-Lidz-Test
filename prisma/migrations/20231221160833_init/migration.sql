-- CreateTable
CREATE TABLE "Event" (
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "total_attendees" INTEGER NOT NULL DEFAULT 0,
    "adultsOnly" BOOLEAN NOT NULL DEFAULT false,
    "eventId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Attendee" (
    "attendeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "eventId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventId_key" ON "Event"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendee_attendeeId_key" ON "Attendee"("attendeeId");

-- AddForeignKey
ALTER TABLE "Attendee" ADD CONSTRAINT "Attendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;
