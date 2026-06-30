declare module 'jsonwebtoken' {
  export interface SignOptions {
    expiresIn?: string | number
    algorithm?: string
    issuer?: string
    audience?: string | string[]
    subject?: string
    jwtid?: string
    noTimestamp?: boolean
    header?: object
    keyid?: string
  }

  export interface VerifyOptions {
    algorithms?: string[]
    audience?: string | string[]
    issuer?: string | string[]
    subject?: string
    clockTolerance?: number
    maxAge?: string | number
    complete?: boolean
  }

  export interface JwtPayload {
    [key: string]: any
    iss?: string
    sub?: string
    aud?: string | string[]
    exp?: number
    nbf?: number
    iat?: number
    jti?: string
  }

  export function sign(
    payload: string | object | Buffer,
    secretOrPrivateKey: string,
    options?: SignOptions
  ): string

  export function verify(
    token: string,
    secretOrPublicKey: string,
    options?: VerifyOptions
  ): JwtPayload | string

  export function decode(
    token: string,
    options?: { complete?: boolean; json?: boolean }
  ): JwtPayload | string | null

  const jwt: {
    sign: typeof sign
    verify: typeof verify
    decode: typeof decode
    SignOptions: SignOptions
  }
  export default jwt
}
