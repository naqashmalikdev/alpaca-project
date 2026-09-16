import { Injectable } from '@nestjs/common';
import {
  AlpacaAccount,
  AlpacaOrder,
  AlpacaPosition,
  AlpacaTradingClient,
} from '../alpaca/alpaca-trading.client';
import { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class TradingService {
  constructor(private readonly alpaca: AlpacaTradingClient) {}

  getAccount(): Promise<AlpacaAccount> {
    return this.alpaca.getAccount();
  }

  placeOrder(dto: PlaceOrderDto): Promise<AlpacaOrder> {
    return this.alpaca.placeOrder({
      symbol: dto.symbol,
      qty: dto.qty,
      side: dto.side,
      type: dto.type ?? 'market',
      time_in_force: dto.time_in_force ?? 'day',
    });
  }

  getOrder(orderId: string): Promise<AlpacaOrder> {
    return this.alpaca.getOrder(orderId);
  }

  getPosition(symbol: string): Promise<AlpacaPosition> {
    return this.alpaca.getPosition(symbol);
  }

  listPositions(): Promise<AlpacaPosition[]> {
    return this.alpaca.listPositions();
  }
}
