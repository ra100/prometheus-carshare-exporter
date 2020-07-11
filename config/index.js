const defaultConfig = require('./default.json')

let config = {
  ...defaultConfig,
}

const configName = process.env.CONFIG_NAME || './local.json'

try {
  const localConfig = require(configName) // eslint-disable-line
  config = {
    ...config,
    ...localConfig,
  }
} catch (e) {
  console.log(e) // eslint-disable-line no-console
}

module.exports = {
  ...config,
}
