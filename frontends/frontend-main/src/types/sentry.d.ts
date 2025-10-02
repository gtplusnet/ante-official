declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $sentrySetUser: (user: { id: string | number; username?: string; email?: string }) => void;
  }
}