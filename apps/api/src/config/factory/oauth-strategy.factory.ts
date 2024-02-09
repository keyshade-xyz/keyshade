import { PassportStrategy } from '@nestjs/passport'

/**
 * OAuthStrategyFactory interface
 *
 * This interface serves as a factory for creating OAuth Strategy.
 * Any OAuth factory created must implement this interface.
 *
 * @interface OAuthStrategyFactory - OAuth Strategy Factory
 * @template T - Generic type
 * @method createOAuthStrategy - Create OAuth Strategy
 * @returns {T} - Returns OAuth Strategy
 */
export interface OAuthStrategyFactory {
  createOAuthStrategy<T extends typeof PassportStrategy>(): T | null

  isOAuthEnabled(): boolean
}
