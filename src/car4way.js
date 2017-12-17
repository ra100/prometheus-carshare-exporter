const prometheus = require('prometheus-wrapper')
const axios = require('axios')

const LABELS = [
  'name',
  'id',
  'license',
  'type',
  'location',
  'city'
]

const client = axios.create({
  timeout: 5000
})

const parseData = (data) => {
  const { locations, car_categories } = data
  const categories = {}
  let transformed = []
  car_categories.forEach((category) => {
    categories[category.category_id] = category
  })
  locations.forEach((location) => {
    const city = location.city
    const locationName = location.location_name
    transformed = transformed.concat(location.cars.map((car) => {
      const type = categories[car.car_category_id].category_name
      return {
        name: `${type} - ${car.id}`,
        id: car.id,
        license: car.license_plate_number,
        type,
        location: locationName,
        city,
        lat: Number(car.position.lat),
        lng: Number(car.position.lon)
      }
    }))
  })
  return transformed
}

// car4way returns var data = {}; in .json, WTF?
const makeValidJson = data => JSON.parse(data.replace(/^.*=\s*/, '').replace(';', ''))

const getData = config =>
  client.get(config.api)
    .then((response) => {
      const { data } = response
      return makeValidJson(data)
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
      location: car.location,
      city: car.city
    }
    prometheus.get('car_lat').set(carLabels, car.lat)
    prometheus.get('car_lng').set(carLabels, car.lng)
  })
  prometheus.get('cars_total').set(data.length)
}

module.exports = (config) => {
  prometheus.setNamespace(config.namespace)
  prometheus.createGauge('car_lat', 'Latitude position of car', LABELS)
  prometheus.createGauge('car_lng', 'Longitude position of car', LABELS)
  prometheus.createGauge('cars_total', 'Total available cars')
  return {
    parseData,
    getData: () => getData(config),
    updateMetrics,
    getMetrics: prometheus.getMetrics,
    makeValidJson
  }
}
