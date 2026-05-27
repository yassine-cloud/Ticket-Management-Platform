import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ProjectsService } from './projects.service';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Resolver(() => Project)
export class ProjectsResolver {
  constructor(private readonly projectsService: ProjectsService) {}

  @Mutation(() => Project)
  @Permissions('manage_roles')
  createProject(@Args('createProjectDto') createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Query(() => [Project], { name: 'projects' })
  @Permissions('assign_ticket')
  findAll() {
    return this.projectsService.findAll();
  }

  @Query(() => Project, { name: 'project' })
  @Permissions('assign_ticket')
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.projectsService.findOne(id);
  }

  @Mutation(() => Project)
  @Permissions('manage_roles')
  updateProject(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateProjectDto') updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Mutation(() => Project)
  @Permissions('manage_roles')
  removeProject(@Args('id', { type: () => ID }) id: string) {
    return this.projectsService.remove(id);
  }
}
