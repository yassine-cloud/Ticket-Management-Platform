import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createProjectDto: CreateProjectDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: createProjectDto,
      });

      // Add the project creator as an OWNER member
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: 'OWNER',
        },
      });

      // Create a default project channel and add the creator as a channel member
      const channel = await tx.channel.create({
        data: {
          projectId: project.id,
          createdById: userId,
          name: 'general',
          type: 'PROJECT',
        },
      });

      await tx.channelMember.create({
        data: {
          channelId: channel.id,
          userId,
        },
      });

      return project;
    });
  }

  findAll() {
    return this.prisma.project.findMany();
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    await this.findOne(id);

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
