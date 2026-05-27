import { InputType, PartialType } from '@nestjs/graphql';
import { CreateProjectDto } from './create-project.dto';

@InputType()
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
