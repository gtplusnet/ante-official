declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: {
      init: (params: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookAuthResponse) => void,
        options?: { scope?: string }
      ) => void;
      logout: (callback: () => void) => void;
      getLoginStatus: (callback: (response: FacebookAuthResponse) => void) => void;
      api: (
        path: string,
        params: { fields?: string },
        callback: (response: any) => void
      ) => void;
    };
  }

  interface FacebookAuthResponse {
    status: 'connected' | 'not_authorized' | 'unknown';
    authResponse?: {
      accessToken: string;
      expiresIn: number;
      signedRequest: string;
      userID: string;
    };
  }
}

export {};