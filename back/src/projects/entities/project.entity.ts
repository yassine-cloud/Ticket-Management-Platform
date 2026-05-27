import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isPublic!: boolean;

  @Field()
  isArchived!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
