# geowiki-lib-app
Basic app handling for Geowiki Viewer and OpenStreetBrowser

## USAGE
```js
import App from '@geowiki-net/geowiki-lib-app'

App.modules = [...App.modules, ...require('../modules.js')]

const app = new App()

app.initModules(() => {
  app.loadCssFiles()

  app.init(app.getInitState())
})
```
