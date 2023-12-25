import { Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseService {
  private clientInstance: SupabaseClient;

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async getClient() {
    if (this.clientInstance) {
      return this.clientInstance;
    }

    this.clientInstance = createClient(
      this.configService.get('SUPABASE_API_URL'),
      this.configService.get('SUPABASE_ANON_KEY'),
    );
    return this.clientInstance;
  }
}
