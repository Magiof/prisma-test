import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import {
  CreateMeetingDto,
  DeleteMeetingDto,
  UpdateMeetingDto,
} from './dto/meetings.dto';
import { Cron } from '@nestjs/schedule';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  getMeetings() {
    return this.meetingsService.getMeetings();
  }

  @Get(':meetingId')
  getMeeting(@Param('meetingId', ParseIntPipe) meetingId: number) {
    return this.meetingsService.getMeeting(meetingId);
  }

  @Post()
  createMeeting(@Body() createMeetingDto: CreateMeetingDto) {
    return this.meetingsService.createMeeting(createMeetingDto);
  }
  @Put(':meetingId')
  updateMeeting(
    @Param('meetingId', ParseIntPipe) meetingId: number,
    @Body() updateMeetingDto: UpdateMeetingDto,
  ) {
    return this.meetingsService.updateMeeting(meetingId, updateMeetingDto);
  }
  @Delete(':meetingId')
  deleteMeeting(
    @Param('meetingId', ParseIntPipe) meetingId: number,
    @Body() deleteMeetingDto: DeleteMeetingDto,
  ) {
    return this.meetingsService.deleteMeeting(meetingId, deleteMeetingDto);
  }

  @Cron('0 0 0 * * *')
  deleteMeetingsByCron() {
    return this.meetingsService.deleteMeetingsByCron();
  }
}
