export type CreateMeetingDto = {
  meetingRoomId: number;
  startDate: string;
  endDate: string;
  hostId: string;
};

export interface UpdateMeetingDto extends CreateMeetingDto {}

export interface DeleteMeetingDto {
  hostId: string;
}
