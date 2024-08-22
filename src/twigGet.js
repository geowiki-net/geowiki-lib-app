const Twig = require('twig')

const twigTemplates = {}
defaultOptions = {
  autoescape: true,
  rethrow: true
}

/**
 * compile and render a twig template
 * @param {string|*} template The template to compile and render (if it is not a string, it will be returned immediately as result). If the template has been used before, the compiled version will be used.
 * @param {object} data The context to be rendered.
 * @param {object} [options] Additional options for compilation (see TwigJS for available options).
 * @param {boolean} [options.autoescape=true] Enable autoescape.
 * @param {function} [callback] If a callback function is passed, rendering will happen asynchronously. Some functions/filters may not be available in synchronous mode, so this is recommended. The callback will be passed (err, result).
 * @returns {string} result (if executed synchronously)
 */
module.exports = function twigGet (template, data, options = {}, callback) {
  if (typeof template !== 'string') {
    return template
  }

  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  options = { ...defaultOptions, ...options }

  if (!(template in twigTemplates)) {
    try {
      options.data = template
      twigTemplates[template] = Twig.twig(options)
    } catch (e) {
      const error = 'Error compiling Twig template: ' + e.message

      if (callback) {
        return callback(error)
      } else {
        throw new Error(error)
      }
    }
  }

  if (callback) {
    twigTemplates[template].renderAsync(data)
      .then(result => callback(null, result.trim()))
      .catch(e => callback(new Error('Error rendering Twig template: ' + e.message)))
  } else {
    return twigTemplates[template].render(data).trim()
  }
}
