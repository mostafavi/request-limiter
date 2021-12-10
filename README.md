# request-limiter

Request Limiter

## Contents

- [Installation](#installation)
  - [Docker](#docker)
  - [Run localy](#run-locally)
  - [Test unit] (#test-unit)
  - [Change configurations](#change-configurations)
  - [Current example] (#current-example)
- [Project structure](#project-structure)
- [API Endpoint](#api-endpoint)
  - [Events](#events)
    - [Movement Type Descriptions](#movement-type-descriptions)

## Installation

Here provided 2 ways to build and run this program:

### Docker

1. The first need [Docker](https://docker.com/) installed (**Tested with version 4.1.1**)

2. Go to project root folder where **Dockerfile** exist.

3. Use the below command to create docker image:

```sh
$ docker build . -t node-limiter
```

4. After that we can run image by command below:

```sh
$ docker run -p 4000:4000 -d node-limiter
```

### Run locally

1. In project root folder run command below to download all dependencies:

```sh
$ npm install
```

2. After installing all dependencies we need to run our project

```sh
$ node index.js
```

### Test unit

Test module writen by jest and We can test project by

```sh
$ npm run test
```

### Change configurations

Using env variables you can change the settings, The default port is 4000.

For example you can change settings in Dockerfile:

```sh
ENV HOST=0.0.0.0
ENV PORT=4000
# LOW: 100 MEDIUM: 500 HIGH: 1000  request per hour
ENV LOAD=LOW
```

### Current example

Load and creating instance

```js
const RequestLimitter = require("./middleware/request-limiter/request-limiter");
let rl = new RequestLimitter();
```

Define or change env variables

```js
let port = process.env.PORT || 3000;
let load = process.env.LOAD || "LOW"; // LOW: 100 MEDIUM: 500 HIGH: 1000  request per hour
let host = process.env.HOST || "0.0.0.0"; // Host IP
```

Initialize and define the weight for routes or endpoints

```js
rl.initialize(rl.load[load.toUpperCase()]);

// Set weights for deferent endpoints (Example)
rl.setWeight("/1", 1);
rl.setWeight("/2", 2);
rl.setWeight("/5", 5);
```

Use it as express middleware

```js
app.use(rl.limit);
```

## Project structure

Here is information about structure of files and folders for this project

```
- middleware
	- request-limiter		// request limiter class and test unit
```

## API Endpoint

All routes are open to send request in example we define 4 routes

1. /1 and all other routes with normal weight
2. /2 with 2 points weight
3. /5 with 5 points weight

### Request

Pushs events to API \
Method: **GET** \
Route: **/** \

CURL example:

```sh
curl --location --request GET 'localhost:4000/'
```

Response example:

```json
{
  "message": "Too many requests",
  "retryAfter": 2801
}
```
