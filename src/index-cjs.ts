import * as mod from './index.js';

function commonjsExternalsPlugin(options: mod.CommonjsExternalsPluginOptions) {
  return mod.default(options);
}
/**
 * work around for old users
 */
commonjsExternalsPlugin.default = commonjsExternalsPlugin;
namespace commonjsExternalsPlugin {
  export type CommonjsExternalsPluginOptions =
    mod.CommonjsExternalsPluginOptions;
}

// @ts-expect-error
export = commonjsExternalsPlugin;
// @ts-expect-error
module.exports = commonjsExternalsPlugin;
