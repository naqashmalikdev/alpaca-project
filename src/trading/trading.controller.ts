import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlaceOrderDto } from './dto/place-order.dto';
import { TradingService } from './trading.service';

/**
 * Demonstrates our backend talking to the Alpaca Trading API (paper) using
 * our own credentials. This proves out order placement + order/position
 * retrieval only — see FINDINGS.md for why this does not (and cannot)
 * cover customer account-opening or funding.
 */
@Controller('trading')
export class TradingController {
  constructor(private readonly trading: TradingService) {}

  @Get('account')
  getAccount() {
    return this.trading.getAccount();
  }

  @Post('orders')
  placeOrder(@Body() dto: PlaceOrderDto) {
    return this.trading.placeOrder(dto);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.trading.getOrder(id);
  }

  @Get('positions')
  listPositions() {
    return this.trading.listPositions();
  }

  @Get('positions/:symbol')
  getPosition(@Param('symbol') symbol: string) {
    return this.trading.getPosition(symbol);
  }
}
