import Events from 'events'
import state from './state'
import yaml from 'js-yaml'
import twigGet from './twigGet'
import initModules from './initModules'

/**
 * main Geowiki application
 * @fires App#init
 * @property {Leaflet} map The main map of the App.
 * @property {State} state Access to the state interface.
 * @property {mapLayers} mapLayers Interact with the basemaps.
 */
class App extends Events {
  constructor () {
    super()

    this.state = state
    this.initModules(() => this.getInitState())
  }

  initModules (callback) {
    initModules(this, 'appInit', App.modules, (err) => {
      if (err) {
        global.alert(err.message)
      }

      this.loadCssFiles()
      callback()
    })
  }

  loadCssFiles () {
    App.modules.forEach(m => {
      (m.cssFiles ?? []).forEach(file => {
        const link = document.createElement('link')
        link.setAttribute('rel', 'stylesheet')
        link.setAttribute('href', file)
        document.head.appendChild(link)
      })
    })
  }

  getInitState () {
    let initState = state.parse()
    let defaultState = this.config.defaultState

    if (typeof defaultState === 'string') {
      twigGet(defaultState, { state: initState }, (e, defaultState) => {
        if (e) {
          return global.alert(e.message)
        }

        try {
          defaultState = yaml.load(defaultState)
        } catch (e) {
          return global.alert(e.message)
        }

        initState = { ...defaultState, ...initState }

        this.init(initState)
      })
    } else {
      initState = { ...defaultState, ...initState }

      this.init(initState)
    }
  }

  init (initState) {
    state.on('get', state => this.emit('state-get', state))
    state.on('apply', state => this.emit('state-apply', state))

    this.options = {}
    const promises = []
    /**
     * After loading all modules, the 'init' event is emitted.
     * @event App#init
     * @param {Promises[]} promises - if your init function needs to run async, you may add a promise. After all promises resolved, the execution continues.
     */
    this.emit('init', promises)
    state.init(promises)

    Promise.all(promises).then(() => {
      state.apply(initState)
    })
      .catch(err => {
        global.alert(err.message)
      })
  }

  stateApply (s) {
    state.apply(s)
  }

  updateLink () {
    state.updateLink()
  }

  getParameter (str, fun = 'any') {
    const promises = []
    this.emit(str, promises)
    return Promise[fun](promises)
  }

  setNonInteractive (value) {
    this.interactive = !value
  }

  /**
   * refresh the display of UI elements
   * @fires App#refresh
   */
  refresh () {
    /**
     * UI elements can listen to this event. If it fires, they are requested to update their state.
     * @event App#refresh
     */
    this.emit('refresh')
  }
}

App.modules = []
App.addModule = (module) => {
  App.modules.push(module)
}

module.exports = App
