// src/boot/globalMixin.js
import { boot } from 'quasar/wrappers';
import GlobalMixins from 'src/mixins/GlobalMixins';

export default boot(({ app }) => {
  app.mixin(GlobalMixins);
});
