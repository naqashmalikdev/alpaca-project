import { Module } from '@nestjs/common';
import { AlpacaModule } from '../alpaca/alpaca.module';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';

@Module({
  imports: [AlpacaModule],
  controllers: [TradingController],
  providers: [TradingService],
})
export class TradingModule {}
