const path = require('path');

module.exports = (request, options) => {
  if (
    !options.basedir.includes('node_modules') &&
    request.endsWith('.js') &&
    (request.startsWith('../') || request.startsWith('./'))
  ) {
    const ts = request.replace(/\.js$/, '.ts');
    try {
      return options.defaultResolver(ts, options);
    } catch {
      return options.defaultResolver(
        request.replace(/\.js$/, '/index.ts'),
        options,
      );
    }
  }
  return options.defaultResolver(request, options);
};
