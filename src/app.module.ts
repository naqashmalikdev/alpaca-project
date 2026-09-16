import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { FundsModule } from './funds/funds.module';
import { OauthModule } from './oauth/oauth.module';
import { TradingModule } from './trading/trading.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    TradingModule,
    OauthModule,
    FundsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
