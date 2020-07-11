# prometheus-carshare-exporter

Express app exporter of car sharing metrics for prometheus.io.

## What is this?

This downloads data from car sharing service and creates metrics from it to
be consumed by [prometheus.io](https://prometheus.io).

Supported providers:
- car4way
- revolt

## How to run?

Copy `config/default.json` to `config/local.json` and change values, example:

```json
{
  "api": "https://www.car4way.cz/Upload/data_2017.json", // API to get data from
  "namespace": "car4way", // namespace of the mertics in prometheus
  "port": 9090, // port where exporter will run
  "source": "car4way", // which service to use, see supported providers
  "username": "", // revolt login
  "password": "" // revolt login password
}
```

run

```shell
npm install
npm run start
```

## License

![](http://www.wtfpl.net/wp-content/uploads/2012/12/wtfpl.svg)
