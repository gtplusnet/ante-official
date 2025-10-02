import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiProjectService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns an array of prompt messages with the user's projects as context.
   */
  async getProjectContextPrompts(): Promise<
    { role: string; parts: { text: string }[] }[]
  > {
    const projects = await this.prisma.project.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 10,
    });

    let context = '';
    if (projects.length) {
      context = projects
        .map(
          (p) =>
            `Name: ${p.name}\nStatus: ${p.status}\nDescription: ${p.description || ''}`,
        )
        .join('\n---\n');
    } else {
      context = 'No relevant projects found for this user.';
    }

    return [
      {
        role: 'user',
        parts: [
          {
            text: `Here is a list of my projects:\n${context}`,
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
}
