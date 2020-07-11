const express = require('express')
const config = require('./config')
const car4way = require('./src/car4way')
const revolt = require('./src/revolt')

const { log } = console

const source = {
  car4way,
  revolt,
}[config.source](config)

const app = express()

app.get('/metrics', async (req, res) => {
  const data = await source.getData()
  const parsed = source.parseData(data)
  source.updateMetrics(parsed)
  res.end(source.getMetrics())
})

app.listen(config.port, () => {
  log(`Listening on port ${config.port}`)
})
