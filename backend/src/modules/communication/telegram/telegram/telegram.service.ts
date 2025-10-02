import { Injectable } from '@nestjs/common';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private telegramBotKey: string;
  private channelName: string;
  private bot: any;

  constructor() {
    this.telegramBotKey = process.env.TELEGRAM_BOT_KEY;
    this.channelName = process.env.TELEGRAM_CHANNEL;
    this.bot = new TelegramBot(this.telegramBotKey, { polling: false });
  }

  async sendMessage(message: string, isError = false): Promise<void> {
    try {
      if (isError) {
        await this.bot.sendMessage('-4801985113', message, {
          parse_mode: 'HTML',
        });
      } else {
        await this.bot.sendMessage(this.channelName, message, {
          parse_mode: 'HTML',
        });
      }
    } catch (error) {
      console.error('Failed to send message to Telegram:');
    }
  }
}
