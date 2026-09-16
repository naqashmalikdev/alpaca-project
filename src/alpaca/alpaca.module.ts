import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { AlpacaTradingClient } from './alpaca-trading.client';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => ({
        baseURL: config.get('alpaca.tradingBaseUrl', { infer: true }),
        headers: {
          'APCA-API-KEY-ID': config.get('alpaca.tradingKeyId', { infer: true }),
          'APCA-API-SECRET-KEY': config.get('alpaca.tradingSecretKey', {
            infer: true,
          }),
        },
        timeout: 10000,
      }),
    }),
  ],
  providers: [AlpacaTradingClient],
  exports: [AlpacaTradingClient],
})
export class AlpacaModule {}
