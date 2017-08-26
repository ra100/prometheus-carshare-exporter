import express from 'express'
import prometheus from 'prometheus-wrapper'
import axios from 'axios'
import config from './config'

const app = express()
const client = axios.create({
  timeout: 5000
})
prometheus.setNamespace(config.namespace)

const labels = [
  'name',
  'id',
  'license',
  'type'
]

prometheus.createGauge('car_lat', 'Latitude position of car', labels)
prometheus.createGauge('car_lng', 'Longitude position of car', labels)
prometheus.createGauge('car_km', 'Travel distace with current fuel', labels)
prometheus.createGauge('car_fuel', 'Fuel level', labels)
prometheus.createGauge('car_available', 'If car is currently available', labels)
prometheus.createGauge('car_reservations', 'Current car reservations', labels)

const parseData = (data) => {
  const { cars, car_templates } = data
  const now = Math.floor(Date.now() / 1000)
  const transformed = cars.map((car) => {
    const carTemplate = car_templates.find(
      template => template.id === car.car_template_id)
    const km = Math.round((car.fuel_level / 100) * carTemplate.range)
    const reserved = car.reservations.find(
      reservation => reservation.start < now && reservation.end > now)
    return {
      name: car.name.replace('#', ''),
      id: car.id,
      license: car.license,
      type: `${carTemplate.make} ${carTemplate.model}`,
      lat: car.lat,
      lng: car.lng,
      fuel: car.fuel_level,
      km,
      available: (!reserved && 1) || 0,
      reservations: car.reservations.length
    }
  })
  return transformed
}

const getData = () =>
  client.get(config.api)
    .then((response) => {
      const { data } = response
      return data
    })
    .catch((error) => {
      console.error(error) // eslint-disable-line no-console
      return {}
    })

const updateMetrics = (data) => {
  data.forEach((car) => {
    const carLabels = {
      name: car.name,
      id: car.id,
      license: car.license,
      type: car.type
    }
    prometheus.get('car_lat').set(carLabels, car.lat)
    prometheus.get('car_lng').set(carLabels, car.lng)
    prometheus.get('car_km').set(carLabels, car.km)
    prometheus.get('car_fuel').set(carLabels, car.fuel)
    prometheus.get('car_available').set(carLabels, car.available)
    prometheus.get('car_reservations').set(carLabels, car.reservations)
  })
}

app.get('/metrics', async (req, res) => {
  const data = await getData()
  const parsed = parseData(data)
  updateMetrics(parsed)
  // res.status(200).json(parsed)
  res.end(prometheus.getMetrics())
})

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`) // eslint-disable-line no-console
})
