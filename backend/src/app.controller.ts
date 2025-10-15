import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  root(@Res() res: Response) {
    // Redirect to API documentation
    return res.redirect('/api/docs');
  }
}
