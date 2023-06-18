import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/db/prisma/prisma.service';
import {
  CreateMeetingDto,
  DeleteMeetingDto,
  UpdateMeetingDto,
} from './dto/meetings.dto';
import { Meeting, Prisma } from '@prisma/client';

@Injectable()
export class MeetingsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMeetings() {
    const meetings = await this.prismaService.meeting.findMany({
      include: { host: true, meetingRoom: true },
    });

    return meetings;
  }

  async getMeeting(meetingId: number) {
    const meeting = await this.prismaService.meeting.findUnique({
      where: { id: meetingId },
      include: { host: true, meetingRoom: true },
    });
    if (!meeting) throw new NotFoundException(`User ${meetingId} not found`);

    return meeting;
  }

  async createMeeting(createMeetingDto: CreateMeetingDto) {
    const { startDate, endDate, meetingRoomId, hostId } = createMeetingDto;
    const [_startDate, _endDate] = [new Date(startDate), new Date(endDate)];
    this.stopCreateOrUpdateMeetingWhenParamsIsNotValid(_startDate, _endDate);
    await this.stopCreateOrUpdateMeetingWhenHostReservedMeetingsMoreThenSixHours(
      hostId,
      _endDate.getHours() - _startDate.getHours(),
    );
    await this.stopCreateOrUpdateMeetingWhenMeetingRoomIsNotAvailable(
      _startDate,
      _endDate,
      meetingRoomId,
    );

    const createdMeeting = await this.prismaService.meeting.create({
      data: { startDate, endDate, meetingRoomId, hostId },
      include: { host: true, meetingRoom: true },
    });

    return createdMeeting;
  }

  async updateMeeting(meetingId: number, updateMeetingDto: UpdateMeetingDto) {
    const { startDate, endDate, hostId, meetingRoomId } = updateMeetingDto;
    const [_startDate, _endDate] = [new Date(startDate), new Date(endDate)];
    this.stopCreateOrUpdateMeetingWhenParamsIsNotValid(_startDate, _endDate);
    const meeting = (await this.prismaService.meeting.findUnique({
      where: { id: meetingId },
    })) as Meeting;
    this.stopUpdateOrDeleteMeetingWhenRequestIsNotValid(meeting, hostId);
    const addHours =
      _endDate.getHours() -
      _startDate.getHours() -
      (meeting.endDate.getHours() - meeting.startDate.getHours());
    await this.stopCreateOrUpdateMeetingWhenHostReservedMeetingsMoreThenSixHours(
      hostId,
      addHours,
    );
    await this.stopCreateOrUpdateMeetingWhenMeetingRoomIsNotAvailable(
      _startDate,
      _endDate,
      meetingRoomId,
    );

    const updatedMeeting = await this.prismaService.meeting.update({
      where: { id: meetingId },
      data: { startDate, endDate, meetingRoomId },
      include: { host: true, meetingRoom: true },
    });

    return updatedMeeting;
  }

  async deleteMeeting(meetingId: number, deleteMeetingDto: DeleteMeetingDto) {
    const { hostId } = deleteMeetingDto;
    const meeting = await this.prismaService.meeting.findUnique({
      where: { id: meetingId },
    });
    this.stopUpdateOrDeleteMeetingWhenRequestIsNotValid(meeting, hostId);
    this.stopDeleteMeetingWhenMeetingIsAlreadyOnProcess(
      new Date((meeting as Meeting).startDate),
    );

    const deletedMeeting = await this.prismaService.meeting.delete({
      where: { id: meetingId },
      include: { meetingRoom: true, host: true },
    });

    return deletedMeeting;
  }

  async deleteMeetingsByCron() {
    await this.prismaService.meeting.deleteMany();
  }

  stopUpdateOrDeleteMeetingWhenRequestIsNotValid(
    meeting: Meeting | null,
    hostId: string,
  ) {
    if (!meeting) throw new NotFoundException(`Meeting is not found`);
    if (meeting.hostId !== hostId)
      throw new UnauthorizedException(`Meeting can only be updated by host.`);
  }

  stopCreateOrUpdateMeetingWhenParamsIsNotValid(
    startDate: Date,
    endDate: Date,
  ) {
    const startDateHours = startDate.getHours();
    const endDateHours = endDate.getHours();
    const startDateMinutes = startDate.getMinutes();
    const endDateMinutes = endDate.getMinutes();
    const startDateSeconds = startDate.getSeconds();
    const endDateSeconds = endDate.getSeconds();
    if (startDateHours < 9 || endDateHours > 18)
      throw new BadRequestException(
        `Meeting room is only available between 09:00 and 18:00.`,
      );
    if (
      startDateMinutes !== 0 ||
      endDateMinutes !== 0 ||
      startDateSeconds !== 0 ||
      endDateSeconds !== 0
    )
      throw new BadRequestException(`Dates are must be on time.`);
    if (startDate.getTime() >= endDate.getTime())
      throw new BadRequestException(`End date must be later then start date`);
    const now = new Date();
    if (now.getTime() > startDate.getTime())
      throw new BadRequestException(`Meeting must be start after now.`);
  }

  async stopCreateOrUpdateMeetingWhenHostReservedMeetingsMoreThenSixHours(
    hostId: string,
    addHours: number,
  ) {
    const reservedMeetingTotalHours = await this.prismaService.meeting
      .findMany({
        where: { hostId },
        select: { startDate: true, endDate: true },
      })
      .then((meetings) =>
        meetings.reduce((total, meeting) => {
          const hours =
            meeting.endDate.getHours() - meeting.startDate.getHours();
          return total + hours;
        }, 0),
      );
    if (reservedMeetingTotalHours + addHours > 6)
      throw new BadRequestException(
        `Meetings can only be reserved for six hours a day.`,
      );
  }

  async stopCreateOrUpdateMeetingWhenMeetingRoomIsNotAvailable(
    startDate: Date,
    endDate: Date,
    meetingRoomId: number,
    isUpdate?: boolean,
  ) {
    const meetingWhereInput: Prisma.MeetingWhereInput = {
      AND: [
        {
          startDate: { lt: endDate },
          endDate: { gt: startDate },
          meetingRoomId,
        },
      ],
    };
    const meetingWhereInputWhenUpdate: Prisma.MeetingWhereInput = {
      ...meetingWhereInput,
      meetingRoomId: { notIn: [meetingRoomId] },
    };
    const existingMeetings = await this.prismaService.meeting.findMany({
      where: isUpdate ? meetingWhereInputWhenUpdate : meetingWhereInput,
    });
    if (existingMeetings.length)
      throw new BadRequestException(`The meeting room is already reserved.`);
  }

  stopDeleteMeetingWhenMeetingIsAlreadyOnProcess(startDate: Date) {
    const now = new Date();
    if (now.getTime() > startDate.getTime())
      throw new BadRequestException(`Meeting is already on process.`);
  }
}
