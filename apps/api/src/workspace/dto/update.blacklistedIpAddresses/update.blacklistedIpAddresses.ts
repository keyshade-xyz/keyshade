import { IsArray, ArrayNotEmpty, IsIP } from 'class-validator'

export class UpdateBlacklistedIpAddresses {
  @IsArray()
  @ArrayNotEmpty()
  @IsIP(undefined, { each: true })
  ipAddresses: string[]
}
