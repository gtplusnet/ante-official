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
      this.telegramService.sendMessage(`${info.message}`);
    }

    callback();
  }
}

export default TelegramTransport;
