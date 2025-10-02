import {
  Inject,
  Controller,
  Get,
  Res,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ScopeListDTO } from '../../../../dto/scope.validator.dto';
import { ScopeService } from './scope.service';
import { UtilityService } from '@common/utility.service';

@Controller('scope')
export class ScopeController {
  @Inject() public scopeService: ScopeService;
  @Inject() public utility: UtilityService;

  @Get('list')
  async getScopeList(@Res() response, @Query() query: ScopeListDTO) {
    try {
      const scopeTree = await this.scopeService.getList(query);
      return response.status(HttpStatus.OK).json({
        message: 'Scope list has been fetched.',
        scopeTree,
      });
    } catch (err) {
      return this.utility.errorResponse(
        response,
        err,
        'Scope list cannot be retrieved.',
      );
    }
  }
}
