# prometheus-carshare-exporter
Express app exporter of carshare metrics for prometheus.io

## What is this?

This downloads data from `api.instacarshare.com` for one client and creates
metrics from it to be consumed by [prometheus.io](https://prometheus.io).

## How to run?

Copy `config/default.json` to `config/local.json` and change values, example:

```json
{
  "api": "https://api.instacarshare.com/client_something/api/v1.3/search?",
  "namespace": "something",
  "port": 9090
}
```

run

```shell
npm install
npm run start
```

## License

![](http://www.wtfpl.net/wp-content/uploads/2012/12/wtfpl.svg)
