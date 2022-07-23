const fs = require('fs')
const path = require('path')
const { makeValidJson, parseData } = require('./car4way')

describe('car4way', () => {
  describe('makeValidJson()', () => {
    test('should return parsed cars data', () => {
      const text = fs
        .readFileSync(path.join(__dirname, '__mocks__/data_2017.json'))
        .toString()
      const parsed = makeValidJson(text)
      expect(parsed).toMatchSnapshot()
    })

    test('should return parsed map data', () => {
      const text = fs
        .readFileSync(path.join(__dirname, '__mocks__/MapData.json'))
        .toString()
      const parsed = makeValidJson(text)
      expect(parsed).toMatchSnapshot()
    })
  })
})
