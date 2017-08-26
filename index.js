import express from 'express'
import prometheus from 'prometheus-wrapper'
import axios from 'axios'
import config from './config'

const app = express()
const client = axios.create({
  timeout: 5000
})

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
      car_name: car.name.replace('#', ''),
      car_id: car.id,
      car_fuel: car.fuel_level,
      car_license: car.license,
      car_position: `${car.lat},${car.lng}`,
      car_type: `${carTemplate.make} ${carTemplate.model}`,
      car_km: km,
      car_available: !reserved || false,
      car_reservations: car.reservations.length
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

prometheus.setNamespace(config.namespace)

app.get('/metrics', async (req, res) => {
  const data = await getData()
  const parsed = parseData(data)
  res.status(200).json(parsed)
  // res.end(prometheus.getMetrics())
})

app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`) // eslint-disable-line no-console
})
