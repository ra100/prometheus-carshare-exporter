const fs = require('fs')
const path = require('path')
const config = require('../config')
const car4way = require('./car4way')(config)
const sample = require('./__mocks__/sample.json')

describe('car4way', () => {
  describe('makeValidJson()', () => {
    test('should return parsed data', () => {
      const text = fs
        .readFileSync(path.join(__dirname, '__mocks__/data_2017.json'))
        .toString()
      const parsed = car4way.makeValidJson(text)
      expect(parsed).toMatchSnapshot()
    })
  })

  describe('parseData()', () => {
    test('should transform data', () => {
      const transformed = car4way.parseData(sample)
      expect(transformed).toMatchSnapshot()
    })
  })
})
