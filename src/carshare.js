const prometheus = require('prometheus-wrapper')
const axios = require('axios')

const LABELS = ['name', 'id', 'license', 'type']

const client = axios.create({
  timeout: 5000,
})

const parseData = (data) => {
  const { cars, car_templates: carTemplates } = data
  const now = Math.floor(Date.now() / 1000)
  const transformed = cars.map((car) => {
    const carTemplate = carTemplates.find(
      (template) => template.id === car.car_template_id
    )
    const km = Math.round((car.fuel_level / 100) * carTemplate.range)
    const reserved = car.reservations.find(
      (reservation) => reservation.start < now && reservation.end > now
    )
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
      reservations: car.reservations.length,
    }
  })
  return transformed
}

const getData = (config) =>
  client
    .get(config.api)
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
      type: car.type,
    }
    prometheus.get('car_lat').set(carLabels, car.lat)
    prometheus.get('car_lng').set(carLabels, car.lng)
    prometheus.get('car_km').set(carLabels, car.km)
    prometheus.get('car_fuel').set(carLabels, car.fuel)
    prometheus.get('car_available').set(carLabels, car.available)
    prometheus.get('car_reservations').set(carLabels, car.reservations)
  })
}
module.exports = (config) => {
  prometheus.setNamespace(config.namespace)
  prometheus.createGauge('car_lat', 'Latitude position of car', LABELS)
  prometheus.createGauge('car_lng', 'Longitude position of car', LABELS)
  prometheus.createGauge('car_km', 'Travel distace with current fuel', LABELS)
  prometheus.createGauge('car_fuel', 'Fuel level', LABELS)
  prometheus.createGauge(
    'car_available',
    'If car is currently available',
    LABELS
  )
  prometheus.createGauge('car_reservations', 'Current car reservations', LABELS)
  return {
    parseData,
    getData: () => getData(config),
    updateMetrics,
    getMetrics: prometheus.getMetrics,
  }
}
