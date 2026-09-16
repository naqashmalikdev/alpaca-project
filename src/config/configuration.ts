export interface AppConfig {
  port: number;
  alpaca: {
    tradingKeyId: string;
    tradingSecretKey: string;
    tradingBaseUrl: string;
    oauth: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      scope: string;
      env: 'live' | 'paper';
    };
  };
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  alpaca: {
    tradingKeyId: process.env.ALPACA_TRADING_KEY_ID ?? '',
    tradingSecretKey: process.env.ALPACA_TRADING_SECRET_KEY ?? '',
    tradingBaseUrl:
      process.env.ALPACA_TRADING_BASE_URL ?? 'https://paper-api.alpaca.markets',
    oauth: {
      clientId: process.env.ALPACA_OAUTH_CLIENT_ID ?? '',
      clientSecret: process.env.ALPACA_OAUTH_CLIENT_SECRET ?? '',
      redirectUri:
        process.env.ALPACA_OAUTH_REDIRECT_URI ??
        'http://localhost:3000/oauth/callback',
      scope: process.env.ALPACA_OAUTH_SCOPE ?? 'trading account:write',
      env: (process.env.ALPACA_OAUTH_ENV as 'live' | 'paper') ?? 'paper',
    },
  },
});
