const prometheus = require('prometheus-wrapper')
const axios = require('axios')

const client = axios.create({
  timeout: 5000,
})

const provider = 'car4way'

const parseData = (data) => {
  const { locations, car_categories: carCategories } = data
  const categories = {}
  const transformedLocations = []
  let cars = []
  carCategories.forEach((category) => {
    categories[category.category_id] = category
  })
  locations.forEach((location) => {
    const { city } = location
    const locationName = location.location_name
    const locationTypes = {}
    location.cars.forEach((car) => {
      const type = categories[car.car_category_id].category_name
      locationTypes[type] = (locationTypes[type] || 0) + 1
    })
    Object.entries(locationTypes).forEach(([type, count]) => {
      transformedLocations.push({
        name: locationName,
        total: count,
        type,
        city,
      })
    })
    cars = cars.concat(
      location.cars.map((car) => {
        const type = categories[car.car_category_id].category_name
        return {
          name: `${type} - ${car.id}`,
          id: car.id,
          license: car.license_plate_number,
          type,
          location: locationName,
          city,
          lat: Number(car.position.lat),
          lng: Number(car.position.lon),
        }
      })
    )
  })
  return { locations: transformedLocations, cars }
}

// car4way returns var data = {}; in .json, WTF?
const makeValidJson = (data) =>
  JSON.parse(data.replace(/^.*=\s*/, '').replace(';', ''))

const getData = (config) =>
  client
    .get(config.api)
    .then((response) => {
      const { data } = response
      return makeValidJson(data)
    })
    .catch((error) => {
      console.error(error) // eslint-disable-line no-console
      return {}
    })

const updateMetrics = ({ locations, cars }) => {
  cars.forEach((car) => {
    const carLabels = {
      name: car.name,
      id: car.id,
      license: car.license,
      type: car.type,
      location: car.location,
      city: car.city,
      provider,
    }
    prometheus.get('car_lat').set(carLabels, car.lat)
    prometheus.get('car_lng').set(carLabels, car.lng)
  })
  locations.forEach(({ name, city, type, total }) => {
    prometheus.get('cars_total').set({ name, city, type, provider }, total)
  })
}

const getMetrics = async (config) => {
  const data = await getData(config)
  const parsed = parseData(data)
  updateMetrics(parsed)
}

module.exports = {
  getMetrics,
  makeValidJson,
  parseData,
}
