import { Controller, Get, Render } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('api/public/pos')
export class CartPublicController {
  constructor(private configService: ConfigService) {}

  @Get()
  @Public()
  @Render('pos/api-documentation')
  async getDocumentation() {
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    let baseUrl: string;

    if (nodeEnv === 'production') {
      baseUrl = 'https://ante-backend-production-gael2.ondigitalocean.app';
    } else if (nodeEnv === 'staging') {
      baseUrl = 'https://ante-backend-staging-q6udd.ondigitalocean.app';
    } else {
      baseUrl = 'http://localhost:3000';
    }

    return {
      layout: 'api-documentation',
      title: 'POS API Documentation',
      baseUrl: `${baseUrl}/pos`,
      hasSchema: true,
      hasQuickStart: true,
      theme: {
        primaryColor: '#2E7D32',
        secondaryColor: '#43A047',
        headerGradient: 'linear-gradient(135deg, #2E7D32 0%, #43A047 100%)',
        headerGradientDark:
          'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
      },
    };
  }
}
