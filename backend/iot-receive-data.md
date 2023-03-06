# IOT Device Send Data Structure

## Oinkbrew Start "oinkbrew/start"

This event is send when the device is fully started and initialiased. It is ready to receive configurations. This is not the first event to receive after starting up the device.

```
{
  "data": "true",
  "ttl": 60,
  "published_at": "2022-12-09T09:34:31.936Z",
  "coreid": "3b003d000747343232363230",
  "name": "oinkbrew/start"
}
```

## Oinkbrew Device New "oinkbrew/devices/new"

This event is received when the device is starting during initialisation or when a new device is connected. New devices are detected every 30 seconds.

```
{
  "data": "{\"type\":1,\"pin_nr\":\"17\",\"hw_address\":\"0000000000000000\",\"deviceOffset\":0.0}",
  "ttl": 60,
  "published_at": "2022-12-09T09:34:31.056Z",
  "coreid": "3b003d000747343232363230",
  "name": "oinkbrew/devices/new"
}
```

## Oinkbrew Device Remove "oinkbrew/devices/remove"

This event is send when after 1 minute the device or sensor is reprting false data.

```
{
  "data": "{\"type\":1,\"pin_nr\":\"17\",\"hw_address\":\"0000000000000000\",\"deviceOffset\":0.0}",
  "ttl": 60,
  "published_at": "2022-12-09T09:34:31.056Z",
  "coreid": "3b003d000747343232363230",
  "name": "oinkbrew/devices/remove"
}
```

## Oinkbrew Device Values "oinkbrew/device/values"

This event is sent every 10 seconds with current values of all connected devices. A faulty sensor reading is reporting -127.x

```
{
  "data": "[{\"pin_nr\":\"10\",\"hw_address\":\"0000000000000000\",\"value\":0.000000},{\"pin_nr\":\"11\",\"hw_address\":\"0000000000000000\",\"value\":0.000000},{\"pin_nr\":\"16\",\"hw_address\":\"0000000000000000\",\"value\":0.000000},{\"pin_nr\":\"17\",\"hw_address\":\"0000000000000000\",\"value\":0.000000}]",
  "ttl": 60,
  "published_at": "2022-12-09T09:34:34.951Z",
  "coreid": "3b003d000747343232363230",
  "name": "oinkbrew/device/values"
}
```
