import { HttpService } from '@nestjs/axios';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AppConfig } from '../config/configuration';

const ALPACA_AUTHORIZE_URL = 'https://app.alpaca.markets/oauth/authorize';
const ALPACA_TOKEN_URL = 'https://api.alpaca.markets/oauth/token';

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

/**
 * Minimal Alpaca Connect (OAuth2) client — exists solely to empirically
 * validate whether the "pop out to Alpaca, come back" flow works for a
 * brand-new customer (undocumented by Alpaca). See PROPOSAL.md "Risk 1".
 *
 * `state` is tracked in-memory only (no DB in this POC) purely as basic
 * CSRF protection; it does not survive a server restart.
 */
@Injectable()
export class OauthService {
  private readonly issuedStates = new Set<string>();

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  buildAuthorizeUrl(): string {
    const oauth = this.config.get('alpaca.oauth', { infer: true })!;
    const state = randomUUID();
    this.issuedStates.add(state);

    const params = [
      ['response_type', 'code'],
      ['client_id', oauth.clientId],
      ['redirect_uri', oauth.redirectUri],
      ['state', state],
      ['scope', oauth.scope],
      ['env', oauth.env],
    ]
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    return `${ALPACA_AUTHORIZE_URL}?${params}`;
  }

  validateState(state: string | undefined): void {
    if (!state || !this.issuedStates.has(state)) {
      throw new UnauthorizedException(
        'Unknown or missing OAuth state parameter',
      );
    }
    this.issuedStates.delete(state);
  }

  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    const oauth = this.config.get('alpaca.oauth', { infer: true })!;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: oauth.clientId,
      client_secret: oauth.clientSecret,
      redirect_uri: oauth.redirectUri,
    });

    const { data } = await firstValueFrom(
      this.http
        .post<OAuthTokenResponse>(ALPACA_TOKEN_URL, body.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new Error(
              `Alpaca OAuth token exchange failed: ${error.response?.status} ${JSON.stringify(
                error.response?.data,
              )}`,
            );
          }),
        ),
    );
    return data;
  }

  /** Proves the token actually works by reading the connected account. */
  async fetchConnectedAccount(accessToken: string): Promise<unknown> {
    const oauth = this.config.get('alpaca.oauth', { infer: true })!;
    const baseUrl =
      oauth.env === 'live'
        ? 'https://api.alpaca.markets'
        : 'https://paper-api.alpaca.markets';

    const { data } = await firstValueFrom(
      this.http
        .get(`${baseUrl}/v2/account`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            throw new Error(
              `Fetching connected account failed: ${error.response?.status} ${JSON.stringify(
                error.response?.data,
              )}`,
            );
          }),
        ),
    );
    return data;
  }
}
