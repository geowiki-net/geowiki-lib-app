import Events from 'events'
import queryString from 'query-string'
import hash from 'sheet-router/hash'

/**
 * The application state interface.
 * @property {object} current the current state of the App.
 * @property {Object.<State#parameters>} custom parameter formatter functions. The key hash matches the parameter key.
 */

class State extends Events {
  constructor () {
    super()
    this.current = {}

    /**
     * @typedef State#parameters
     * @property {function} stringify A function which stringifies the value (1st parameter).
     * @property {function} parse A function which parses the value (1st parameter).
     */
    this.parameters = {}
  }

  init () {
    hash(loc => {
      this.apply(loc.substr(1))
    })
  }

  /**
   * Call all modules to get the current state of the App.
   * @fires App#state-get
   */
  get () {
    const state = {}

    /**
     * All modules which add to the state shall listen to 'state-get'
     * @event App#state-get
     * @param {object} state Add the modules' state to this hash.
     */
    this.emit('get', state)

    return state
  }

  /**
   * Change state of the app.
   * @param {object} state - Overwrite parameters to the new value.
   * @param {object} [options={}] - Additional options
   * @param {string|null} [options.update=null] - Update to state in the browser history, either with 'push' or 'replace'. On null, the history will not be updated.
   * @emits App#state-apply
   */
  apply (state = null, options = {}) {
    this.previous = { ...this.current }
    if (!state || typeof state === 'string') {
      state = this.parse(state)
    }

    for (const k in state) {
      this.current[k] = state[k]
    }

    if (options.update) {
      this.updateLink(options.update === 'push')
    }

    /**
     * All modules which state needs to change have to listen to 'state-apply'
     * @event App#state-apply
     * @param {object} state Read the new state from this object.
     */
    global.setTimeout(() => {
      this.emit('apply', state)
    }, 0)

    return state
  }

  stringify (state = null) {
    let link = ''

    if (!state) {
      state = this.get()
    }

    // avoid modification of the object
    state = { ...state }

    // path
    if (state.path) {
      link += encodeURIComponent(state.path)
      delete state.path
    }

    // location
    let locPrecision = 5
    if (state.zoom) {
      locPrecision =
        state.zoom > 16
          ? 5
          : state.zoom > 8
            ? 4
            : state.zoom > 4
              ? 3
              : state.zoom > 2
                ? 2
                : state.zoom > 1
                  ? 1
                  : 0
    }

    if (state.zoom && state.lat && state.lon) {
      link += (link === '' ? '' : '&') + 'map=' +
        parseFloat(state.zoom).toFixed(0) + '/' +
        state.lat.toFixed(locPrecision) + '/' +
        state.lon.toFixed(locPrecision)

      delete state.zoom
      delete state.lat
      delete state.lon
    }

    // filter out null values
    state = Object.fromEntries(Object.entries(state).filter(([k, v]) => v !== null))

    // format all parameters with special stringify function
    Object.entries(this.parameters).forEach(([k, parameter]) => {
      if (state[k] && parameter.stringify) {
        state[k] = parameter.stringify(state[k])
      }
    })

    let newHash = queryString.stringify(state)

    // Characters we don't want escaped
    newHash = newHash.replace(/%2F/g, '/')
    newHash = newHash.replace(/%2C/g, ',')
    newHash = newHash.replace(/%3A/g, ':')

    if (newHash !== '') {
      link += (link === '' ? '' : '&') + newHash
    }

    return link
  }

  parse (link = null) {
    if (!link) {
      link = global.location.hash
      link = link.replace(/^#+/, '')
    }

    const firstEquals = link.search('=')
    const firstAmp = link.search('&')
    let urlNonPathPart = ''
    let newState = {}
    let newPath = ''

    if (link === '') {
      // nothing
    } else if (firstEquals === -1) {
      if (firstAmp === -1) {
        newPath = link
      } else {
        newPath = link.substr(0, firstAmp)
      }
    } else {
      if (firstAmp === -1) {
        urlNonPathPart = link
      } else if (firstAmp < firstEquals) {
        newPath = link.substr(0, firstAmp)
        urlNonPathPart = link.substr(firstAmp + 1)
      } else {
        urlNonPathPart = link
      }
    }

    newState = queryString.parse(urlNonPathPart)
    if (newPath !== '') {
      newState.path = decodeURIComponent(newPath)
    }

    if ('map' in newState && newState.map !== 'auto') {
      const parts = newState.map.split('/')
      newState.zoom = parseFloat(parts[0])
      newState.lat = parseFloat(parts[1])
      newState.lon = parseFloat(parts[2])
      delete newState.map
    }

    // format all parameters with special stringify function
    Object.entries(this.parameters).forEach(([k, parameter]) => {
      if (newState[k] && parameter.parse) {
        newState[k] = parameter.parse(newState[k])
      }
    })

    return newState
  }

  /**
   * Update URL to current state.
   * @param {boolean} [push=false] - by default, updateLink replaces state. If push=true, state will be pushed
   */
  updateLink (push = false) {
    if (push) {
      global.history.pushState(null, null, '#' + this.stringify())
    } else {
      global.history.replaceState(null, null, '#' + this.stringify())
    }
  }
}

module.exports = new State()
