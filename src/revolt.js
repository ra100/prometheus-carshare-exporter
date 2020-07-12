const prometheus = require('prometheus-wrapper')
const axios = require('axios')

const { error } = console

const LABELS = ['name', 'id', 'license', 'type']

const client = axios.create({
  timeout: 5000,
})

let token
let expires = 0

const getToken = async ({ username, password, api }) => {
  if (expires > Date.now() && token) {
    return token
  }

  const { data } = await client.post(`${api}/login`, {
    login: username,
    password,
  })
  token = data.access_token
  expires = Date.now() + data.expires_in * 1000
  return token
}

const getData = async (config) => {
  try {
    const accessToken = await getToken(config)
    const response = await client({
      method: 'GET',
      url: '/vehicles',
      baseURL: config.api,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    return response.data
  } catch (e) {
    error('Error fetching data', e)
  }
  return null
}

const parseData = (vehicles) => {
  const types = [false, 'car', false, 'scooter', false, 'kickscooter']
  const transformedVehicles = vehicles
    .filter(
      ({ vehicle_type: vt, working, lat, lng }) =>
        types[vt] && working && lat !== 0 && lng !== 0
    )
    .map((vehicle) => ({
      name: vehicle.badge,
      id: vehicle.id,
      license: vehicle.licence_plate,
      type: types[vehicle.vehicle_type],
      lat: vehicle.lat,
      lng: vehicle.lng,
      capacity: vehicle.capacity,
      occupied: vehicle.occupied,
    }))

  const byType = transformedVehicles.reduce(
    (acc, current) => ({
      ...acc,
      [current.type]: acc[current.type] + 1,
    }),
    {
      car: 0,
      scooter: 0,
      kickscooter: 0,
    }
  )

  return { byType, transformedVehicles }
}

const updateMetrics = ({ byType, transformedVehicles }) => {
  transformedVehicles.forEach((vehicle) => {
    const vehicleLabels = {
      name: vehicle.name,
      id: vehicle.id,
      license: vehicle.license,
      type: vehicle.type,
    }
    prometheus.get('car_lat').set(vehicleLabels, vehicle.lat)
    prometheus.get('car_lng').set(vehicleLabels, vehicle.lng)
    prometheus.get('car_capacity').set(vehicleLabels, vehicle.capacity)
    prometheus.get('car_occupied').set(vehicleLabels, vehicle.occupied ? 1 : 0)
  })
  Object.entries(byType).forEach(([type, total]) => {
    prometheus.get('cars_total').set({ type }, total)
  })
}

module.exports = (config) => {
  prometheus.setNamespace(config.namespace)
  prometheus.createGauge('car_lat', 'Latitude position of car', LABELS)
  prometheus.createGauge('car_lng', 'Longitude position of car', LABELS)
  prometheus.createGauge('car_capacity', 'Vehicle capacity', LABELS)
  prometheus.createGauge('car_occupied', 'If vehicle is available', LABELS)
  prometheus.createGauge('cars_total', 'Total available cars', ['name', 'type'])

  return {
    parseData,
    updateMetrics,
    getData: () => getData(config),
    getMetrics: prometheus.getMetrics,
  }
}
