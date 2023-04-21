import { type APIGatewayEvent } from 'aws-lambda';

import { connectToMongo } from './model/mongoose-db.js';
import { VehicleService } from './service/vehicleService.js';
import { initializeEnvironmentVariables } from './utils/configuration.js';
import { type APIGatewayProxyResult } from 'aws-lambda/trigger/api-gateway-proxy.js';
import { VehicleController } from './controller/vehicleController.js';
import { DealerService } from './service/dealerService.js';
import { DealerController } from './controller/dealerController.js';

initializeEnvironmentVariables();
connectToMongo().then(() => {
    console.log('Connected to MongoDB');
}).catch((e) => {
    console.error('Connection to MongoDB failed.');
    console.error(e);
});
const vehicleService = new VehicleService();
const vehicleController = new VehicleController(vehicleService);

const dealerService = new DealerService();
dealerService.vehicleService = vehicleService;
vehicleService.dealerService = dealerService;
const dealerController = new DealerController(dealerService);

export async function getVehicles(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await vehicleController.getAll(event.queryStringParameters);
}

export async function createVehicle(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await vehicleController.create(event.body);
}

export async function updateVehicle(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await vehicleController.update(event.body);
}

export async function removeVehicle(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await vehicleController.remove(event.pathParameters);
}

export async function getDealers(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await dealerController.getAll(event.queryStringParameters);
}

export async function createDealer(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await dealerController.create(event.body);
}

export async function updateDealer(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await dealerController.update(event.body);
}

export async function removeDealer(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
    return await dealerController.remove(event.pathParameters);
}
