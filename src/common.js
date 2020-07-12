const prometheus = require('prometheus-wrapper')

const LABELS = ['name', 'id', 'license', 'type', 'location', 'city', 'provider']
const TOTAL_LABELS = ['city', 'name', 'type', 'provider']

const initPrometheus = () => {
  prometheus.setNamespace('vehicles')
  prometheus.createGauge('car_lat', 'Latitude position of car', LABELS)
  prometheus.createGauge('car_lng', 'Longitude position of car', LABELS)
  prometheus.createGauge('car_capacity', 'Vehicle capacity', LABELS)
  prometheus.createGauge('car_occupied', 'If vehicle is available', LABELS)
  prometheus.createGauge('cars_total', 'Total available cars', TOTAL_LABELS)
}

module.exports = {
  initPrometheus,
}
