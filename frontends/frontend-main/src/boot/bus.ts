import { EventBus } from 'quasar';
import { boot } from 'quasar/wrappers';
import mitt, { Emitter } from 'mitt';

// Define types for the event bus
type Events = Record<string | symbol, unknown>;

export default boot(({ app }) => {
  const bus = new EventBus();
  const emitter: Emitter<Events> = mitt();

  // for Options API
  app.config.globalProperties.$bus = emitter;

  // for Composition API
  app.provide('bus', bus);
});