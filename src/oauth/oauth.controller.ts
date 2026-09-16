import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { OauthService } from './oauth.service';

/**
 * Validates Alpaca's OAuth ("Connect") flow — specifically whether it
 * supports a brand-new customer end-to-end (see PROPOSAL.md "Risk 1").
 *
 * Manual test flow:
 *   1. GET /oauth/login  -> redirects browser to Alpaca's consent screen
 *   2. Log in (or sign up, if that's offered) and approve
 *   3. Alpaca redirects back to /oauth/callback?code=...&state=...
 *   4. This app exchanges the code for a token and reads the connected
 *      account back, to prove the whole loop works.
 */
@Controller('oauth')
export class OauthController {
  constructor(private readonly oauth: OauthService) {}

  @Get('login')
  login(@Res() res: Response) {
    return res.redirect(this.oauth.buildAuthorizeUrl());
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Query('state') state: string) {
    if (!code) {
      throw new BadRequestException(
        'Missing "code" query parameter from Alpaca redirect',
      );
    }
    this.oauth.validateState(state);

    const token = await this.oauth.exchangeCodeForToken(code);
    const account = await this.oauth.fetchConnectedAccount(token.access_token);

    return { token, account };
  }
}
