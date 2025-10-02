import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { AccountDataResponse } from '@shared/response';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiTaskService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns an array of prompt messages with the user's active tasks as context.
   */
  async getCurrentTasks(
    accountInformation: AccountDataResponse,
  ): Promise<{ role: string; parts: { text: string }[] }[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        assignedToId: accountInformation.id,
        isDeleted: false,
        boardLane: { key: { not: 'DONE' } },
      },
      orderBy: [{ dueDate: 'asc' }, { priorityLevel: 'desc' }],
    });

    return [
      {
        role: 'user',
        parts: [
          {
            text: JSON.stringify({
              type: 'task-list',
              data: tasks,
              message: tasks.length
                ? undefined
                : 'No active tasks found for this user.',
            }),
          },
        ],
      },
    ];
  }

  /**
   * Calls Gemini with the provided prompt array and returns the answer.
   */
  async callGeminiWithPrompt(
    gemini: GoogleGenerativeAI,
    prompt: { role: string; parts: { text: string }[] }[],
  ): Promise<string> {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent({ contents: prompt });
    return result.response.text();
  }

  async getTaskDetailPrompt(
    accountInformation: AccountDataResponse,
    taskIdentifier: string,
  ): Promise<{ role: string; parts: { text: string }[] }[]> {
    // Try to find by id first, then by title (case-insensitive)
    let task = null;
    if (/^\d+$/.test(taskIdentifier)) {
      task = await this.prisma.task.findFirst({
        where: {
          id: Number(taskIdentifier),
          assignedToId: accountInformation.id,
          isDeleted: false,
        },
      });
    }
    if (!task) {
      task = await this.prisma.task.findFirst({
        where: {
          title: { equals: taskIdentifier, mode: 'insensitive' },
          assignedToId: accountInformation.id,
          isDeleted: false,
        },
        include: {
          boardLane: true,
          assignedTo: true,
          project: true,
          createdBy: true,
        },
      });
    }
    if (!task) {
      return [
        {
          role: 'user',
          parts: [
            {
              text: JSON.stringify({
                error: `No task found with identifier: ${taskIdentifier}`,
              }),
            },
          ],
        },
      ];
    }
    // Return the full task as JSON
    return [
      {
        role: 'user',
        parts: [
          { text: JSON.stringify({ type: 'task', data: task }, null, 2) },
        ],
      },
    ];
  }
}
