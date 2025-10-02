import * as Transport from 'winston-transport';
import { TelegramService } from '@modules/communication/telegram/telegram/telegram.service';

class TelegramTransport extends Transport {
  private telegramService: TelegramService;

  constructor(opts: Transport.TransportStreamOptions) {
    super(opts);
    this.telegramService = new TelegramService();
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    // Send the log message to Telegram
    if (process.env.TELEGRAM_DEBUG === 'true') {
      try {
        this.telegramService.sendMessage(`${info.message}`);
      } catch (error) {
        // Silently ignore Telegram errors to prevent transport from failing
      }
    }

    try {
      callback();
    } catch (error) {
      // Silently ignore callback errors to prevent transport from failing
    }
  }
}

export default TelegramTransport;
