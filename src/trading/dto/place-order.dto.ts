import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class PlaceOrderDto {
  @IsString()
  symbol: string;

  @Matches(/^\d+(\.\d+)?$/, {
    message: 'qty must be a positive numeric string',
  })
  qty: string;

  @IsIn(['buy', 'sell'])
  side: 'buy' | 'sell';

  @IsOptional()
  @IsIn(['market', 'limit'])
  type?: 'market' | 'limit';

  @IsOptional()
  @IsIn(['day', 'gtc', 'ioc', 'fok'])
  time_in_force?: 'day' | 'gtc' | 'ioc' | 'fok';
}
