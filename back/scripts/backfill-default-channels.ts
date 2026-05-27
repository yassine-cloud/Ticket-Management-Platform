import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({} as any);

async function main() {
  console.log('Starting backfill: create default channels for projects with no channels');

  const projects = await prisma.project.findMany({ include: { channels: true, members: true } });

  for (const project of projects) {
    if (project.channels && project.channels.length > 0) {
      console.log(`Skipping project ${project.id} — already has ${project.channels.length} channel(s)`);
      continue;
    }

    if (!project.members || project.members.length === 0) {
      console.log(`Skipping project ${project.id} — no project members found to assign as channel creator`);
      continue;
    }

    const owner = project.members[0];

    const channel = await prisma.channel.create({
      data: {
        projectId: project.id,
        createdById: owner.userId,
        name: 'general',
        type: 'PROJECT',
      },
    });

    await prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId: owner.userId,
      },
    });

    console.log(`Created channel ${channel.id} for project ${project.id} and added member ${owner.userId}`);
  }

  console.log('Backfill completed');
}

main()
  .catch((err) => {
    console.error('Backfill error', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
