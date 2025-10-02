declare module 'express-basic-auth' {
  import { RequestHandler } from 'express';

  interface BasicAuthOptions {
    users?: { [key: string]: string };
    authorizer?: (
      username: string,
      password: string,
      callback: (err: any, result: boolean) => void,
    ) => void;
    authorizeAsync?: boolean;
    challenge?: boolean;
    realm?: string;
    unauthorizedResponse?: ((req: any) => string | object) | string | object;
  }

  function basicAuth(options: BasicAuthOptions): RequestHandler;
  export = basicAuth;
}
