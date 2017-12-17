const defaultConfig = require('./default.json')

let config = {
  ...defaultConfig
}

try {
  const localConfig = require('./local.json') // eslint-disable-line
  config = {
    ...config,
    ...localConfig
  }
} catch (e) {
  console.log(e) // eslint-disable-line no-console
}

module.exports = {
  ...config
}
