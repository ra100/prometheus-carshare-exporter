const express = require('express')
const config = require('./config')
const carshare = require('./src/carshare')
const car4way = require('./src/car4way')

const source = ({
  carshare,
  car4way
})[config.source](config)

const app = express()

app.get('/metrics', async (req, res) => {
  const data = await source.getData()
  const parsed = source.parseData(data)
  source.updateMetrics(parsed)
  res.end(source.getMetrics())
})

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`) // eslint-disable-line no-console
})
