import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { FundMappingService } from './fund-mapping.service';

@Controller('funds')
export class FundsController {
  constructor(private readonly fundMapping: FundMappingService) {}

  @Get('vintages')
  listVintages() {
    return this.fundMapping.listVintages();
  }

  @Get('target-date')
  resolveTargetDate(@Query('year', ParseIntPipe) year: number) {
    return this.fundMapping.resolve(year);
  }
}
