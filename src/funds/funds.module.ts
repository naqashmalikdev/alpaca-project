import { Module } from '@nestjs/common';
import { FundMappingService } from './fund-mapping.service';
import { FundsController } from './funds.controller';

@Module({
  controllers: [FundsController],
  providers: [FundMappingService],
  exports: [FundMappingService],
})
export class FundsModule {}
