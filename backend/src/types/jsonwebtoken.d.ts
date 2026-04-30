declare module 'jsonwebtoken' {
  const jwt: {
    verify: (token: string, secretOrPublicKey: string) => unknown
  }

  export default jwt
}
