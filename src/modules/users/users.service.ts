import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './types/user.type';
import { CreateUserDto } from './dto/create-user.dto';
import { nanoid } from 'nanoid';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/db/prisma/prisma.service';

@Injectable()
export class UsersService {
  private readonly prismaService: PrismaService;
  private users: Array<User>;
  constructor() {
    this.users = [];
  }

  async getAll() {
    return await this.prismaService.user.findMany();
  }

  async createUser(dto: CreateUserDto) {
    const { name, depart } = dto;
    const id = nanoid(6);
    const newUser = {
      id,
      name,
      depart,
    };
    this.users.push(newUser);
    await this.prismaService.user.create({ data: { id, name, depart } });

    return newUser;
  }

  async updateUser(uid: string, dto: UpdateUserDto) {
    const { name, depart } = dto;
    const user = await this.findUserById(uid);
    user.name = name ?? user.name;
    user.depart = depart ?? user.depart;
    await this.prismaService.user.update({
      where: { id: uid },
      data: { name: user.name, depart: user.depart },
    });

    return user;
  }

  async deleteUser(uid: string) {
    const user = this.findUserById(uid);
    this.users = this.users.filter((user) => user.id !== uid);
    await this.prismaService.user.delete({ where: { id: uid } });
    return { ...user, deleted: true };
  }

  async findUserById(uid: string) {
    // const user = this.users.find((user) => user.id === uid);
    // if (!user) {
    //   throw new NotFoundException(`User ${uid} not found`);
    // }
    const user = await this.prismaService.user.findUnique({
      where: { id: uid },
    });
    if (!user) {
      throw new NotFoundException(`User ${uid} not found`);
    }

    return user;
  }
}
