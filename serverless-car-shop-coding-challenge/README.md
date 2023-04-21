# Coding challenge

## Installation

### Serverless

```
npm install -g serverless
```

### Javascript packages

```
npm i
```

### MongoDB

Create and run the MongoDB docker container:

```
docker run --name coding-challenge-car-shop-mongo -e MONGO_INITDB_ROOT_USERNAME=mongoadmin \
 -e MONGO_INITDB_ROOT_PASSWORD=password \
 -p 27017:27017 \
 mongo:5.0.16
```

If you change the username or password, you need to change them in
config/.env.dev too.

To run the docker container again after stopping it:

```
docker container start coding-challenge-car-shop-mongo
```

## Usage

### Deploying locally

```
serverless offline
```

The API will be available at http://localhost:3000.

### Deploying on AWS

```
serverless deploy
```

## Running the tests

### Unit tests

```
npm run unit-test
```

### Integration tests

Run the Mongo container, then:

```
npm run integration-test
```

## Contributing

### Regenerate Mongoose classes

After changing the Mongo schema, run:

```
npx mtgen src/model --output=src/generated
```

### Generate code from the OpenAPI definitions

```
npx openapi-typescript api.yaml --output src/generated/openapi.ts
```
