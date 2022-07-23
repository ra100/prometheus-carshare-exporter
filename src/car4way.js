const prometheus = require('prometheus-wrapper')
const axios = require('axios')

const client = axios.create({
  timeout: 5000,
})

const provider = 'car4way'

// car4way returns var data = {}; in .json, WTF?
const makeValidJson = (data) =>
  JSON.parse(
    data
      .replace(/var availableCategories.*$/, '')
      .replace('var data =', '')
      .replace(';', '')
  )

const getData = (url) =>
  client
    .get(url)
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

const getCarPlates = ({ locations }) => {
  const cars = locations.flatMap(({ cars }) =>
    cars.map(({ id, license_plate_number }) => [id, license_plate_number])
  )

  return new Map(cars)
}

const getCategories = ({ CarCategories }) =>
  new Map(CarCategories.map(({ Id, Name }) => [Id, Name]))

const getLocations = ({ Locations }) =>
  new Map(
    Locations.map(({ Id, Name, City }) => [Id, { name: Name, city: City }])
  )

const getCars = ({ Locations }, categories, locations, plates) =>
  Locations.flatMap(({ Cars }) => Cars).map(
    ({ Id, CategoryId, LocationId, Position }) => ({
      name: `${categories.get(CategoryId) || 'N/A'} - ${Id}`,
      id: Id,
      license: plates.get(Id) || 'N/A',
      type: categories.get(CategoryId) || 'N/A',
      location: (locations.get(LocationId) || { name: 'N/A' }).name,
      city: (locations.get(LocationId) || { city: 'N/A' }).city,
      lat: Number(Position.Lat),
      lng: Number(Position.Lon),
    })
  )

const getLocationCounts = (cars) => {
  const locations = cars.reduce((acc, car) => {
    const { location, city, type } = car
    const key = `${type} - ${city}`
    if (!acc[key]) {
      acc[key] = {
        name: location,
        city,
        type,
        total: 0,
      }
    }
    acc[key].total += 1
    return acc
  }, {})

  return Object.values(locations)
}

const getMetrics = async (config) => {
  const plates = getCarPlates(await getData(config.cars))
  const mapData = await getData(config.mapData)
  const categories = getCategories(mapData)
  const locations = getLocations(mapData)
  const cars = getCars(mapData, categories, locations, plates)
  updateMetrics({ cars, locations: getLocationCounts(cars) })
}

module.exports = {
  getMetrics,
  makeValidJson,
}
