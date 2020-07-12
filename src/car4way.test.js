const fs = require('fs')
const path = require('path')
const { makeValidJson, parseData } = require('./car4way')
const sample = require('./__mocks__/sample.json')

describe('car4way', () => {
  describe('makeValidJson()', () => {
    test('should return parsed data', () => {
      const text = fs
        .readFileSync(path.join(__dirname, '__mocks__/data_2017.json'))
        .toString()
      const parsed = makeValidJson(text)
      expect(parsed).toMatchSnapshot()
    })
  })

  describe('parseData()', () => {
    test('should transform data', () => {
      const transformed = parseData(sample)
      expect(transformed).toMatchSnapshot()
    })
  })
})
