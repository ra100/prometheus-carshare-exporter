const express = require('express')
const prometheus = require('prometheus-wrapper')

const config = require('./config')

const { initPrometheus } = require('./src/common')
const car4way = require('./src/car4way')

const { log, error } = console

const { providers, port } = config

const sources = {
  car4way,
}

initPrometheus()

const app = express()

app.get('/metrics', async (req, res) => {
  const promises = providers.map((provider) => {
    return sources[provider.source].getMetrics(provider)
  })

  try {
    await Promise.all(promises)

    const metrics = await prometheus.getMetrics()

    res.status(200).send(metrics)
  } catch (e) {
    error(e)
    res.status(500).send(e.message)
  }
})

app.listen(port, () => {
  log(`Listening on port ${port}`)
})
