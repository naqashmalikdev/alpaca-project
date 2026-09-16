import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  cash: string;
  equity: string;
  buying_power: string;
  [key: string]: unknown;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  symbol: string;
  qty: string | null;
  side: string;
  type: string;
  time_in_force: string;
  status: string;
  filled_qty: string;
  filled_avg_price: string | null;
  submitted_at: string;
  [key: string]: unknown;
}

export interface AlpacaPosition {
  symbol: string;
  qty: string;
  side: string;
  avg_entry_price: string;
  market_value: string;
  unrealized_pl: string;
  current_price: string;
  [key: string]: unknown;
}

export interface PlaceOrderRequest {
  symbol: string;
  qty: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  time_in_force: 'day' | 'gtc' | 'ioc' | 'fok';
  limit_price?: string;
}

/**
 * Thin wrapper around the Alpaca Trading API (paper or live), used purely to
 * demonstrate that our backend can place/retrieve orders and positions.
 * This client intentionally does NOT attempt account creation or funding —
 * see FINDINGS.md for why those are Broker API-only capabilities.
 */
@Injectable()
export class AlpacaTradingClient {
  constructor(private readonly http: HttpService) {}

  async getAccount(): Promise<AlpacaAccount> {
    return this.request<AlpacaAccount>('get', '/v2/account');
  }

  async placeOrder(order: PlaceOrderRequest): Promise<AlpacaOrder> {
    return this.request<AlpacaOrder>('post', '/v2/orders', order);
  }

  async getOrder(orderId: string): Promise<AlpacaOrder> {
    return this.request<AlpacaOrder>('get', `/v2/orders/${orderId}`);
  }

  async getPosition(symbol: string): Promise<AlpacaPosition> {
    return this.request<AlpacaPosition>('get', `/v2/positions/${symbol}`);
  }

  async listPositions(): Promise<AlpacaPosition[]> {
    return this.request<AlpacaPosition[]>('get', '/v2/positions');
  }

  private async request<T>(
    method: 'get' | 'post',
    url: string,
    data?: unknown,
  ): Promise<T> {
    const { data: response } = await firstValueFrom(
      this.http.request<T>({ method, url, data }).pipe(
        catchError((error: AxiosError) => {
          throw new Error(
            `Alpaca Trading API ${method.toUpperCase()} ${url} failed: ${
              error.response?.status
            } ${JSON.stringify(error.response?.data)}`,
          );
        }),
      ),
    );
    return response;
  }
}
