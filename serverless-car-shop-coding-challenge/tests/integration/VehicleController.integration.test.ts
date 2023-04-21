import { VehicleService } from '../../src/service/vehicleService.js';
import { Vehicle } from '../../src/model/vehicle.js';
import { Dealer } from '../../src/model/dealer.js';
import { connectToMongo } from '../../src/model/mongoose-db.js';
import { initializeEnvironmentVariables } from '../../src/utils/configuration.js';
import { VehicleController } from '../../src/controller/vehicleController.js';
import { type CreateVehicleDTO, type UpdateVehicleDTO } from '../../src/model/dto/vehicleDTO.js';
import { type VehicleDocument } from '../../src/generated/mongoose.gen.js';
import mongoose from 'mongoose';
import { resetDatabase } from './fakeData.js';
import { assertNotNull } from '../utils/assert.js';
import { DealerService } from '../../src/service/dealerService.js';
import { expectMongoArrayNotToContainId, expectMongoArrayToContainId, getObjectIdAsString } from './utils.js';

beforeAll(async() => {
    initializeEnvironmentVariables();
    await connectToMongo();
});

afterAll(async() => {
    await mongoose.disconnect();
});

function compareVehicles(a: CreateVehicleDTO | VehicleDocument | null, b: CreateVehicleDTO | VehicleDocument | null): void {
    a = assertNotNull(a);
    b = assertNotNull(b);
    expect(a.make).toEqual(b.make);
    expect(a.color).toEqual(b.color);
    assertNotNull(a.dealer);
    assertNotNull(b.dealer);
    expect(getObjectIdAsString(a.dealer)).toEqual(getObjectIdAsString(b.dealer));
    expect(a.fuelType).toEqual(b.fuelType);
    expect(a.mileage).toEqual(b.mileage);
    expect(a.vehicleModel).toEqual(b.vehicleModel);
    expect(a.transmission).toEqual(b.transmission);
    expect(a.vehicleType).toEqual(b.vehicleType);
}

const dealerService = new DealerService();
const vehicleService = new VehicleService();
dealerService.vehicleService = vehicleService;
vehicleService.dealerService = dealerService;
const vehicleController = new VehicleController(vehicleService);

beforeEach(async() => {
    await resetDatabase();
});

describe('VehicleController', () => {
    describe('getAllVehicles()', () => {
        test('should return an empty array if there are no vehicles', async() => {
            await Vehicle.deleteMany({}).exec();
            const response = await vehicleController.getAll();
            expect(response).toMatchSnapshot();
        });

        test('should return vehicles when there are vehicles', async() => {
            const response = await vehicleController.getAll();
            expect(response).toMatchSnapshot();
        });

        test('should return vehicles when filtering by dealer', async() => {
            const dealer = assertNotNull(await Dealer.findOne({ _id: '644171318ce5b4f5098621cb' }).exec());
            const response = await vehicleController.getAll({ dealer: dealer._id.toString() });
            expect(response).toMatchSnapshot();
        });
    });

    describe('createVehicle()', () => {
        test('should create a vehicle when the request is correct', async() => {
            const dealerBefore = assertNotNull(await Dealer.findOne({}).exec());
            const dto: CreateVehicleDTO = {
                make: 'make2',
                color: 'orange',
                dealer: dealerBefore.id,
                fuelType: 'lpg',
                mileage: 4,
                vehicleModel: 'model3',
                transmission: 'automatic',
                vehicleType: 'other'
            };
            const timestampBeforeRequest = +Date.now();
            const response = await vehicleController.create(JSON.stringify(dto));
            const timeStampAfterRequest = +Date.now();

            const vehicleResponse = JSON.parse(response.body).data;
            compareVehicles(vehicleResponse, dto);
            const creationDateTimestamp = +new Date(vehicleResponse.creationDate);
            const lastUpdateTimestamp = +new Date(vehicleResponse.lastUpdateDate);
            expect(creationDateTimestamp).toBeGreaterThanOrEqual(timestampBeforeRequest);
            expect(creationDateTimestamp).toBeLessThanOrEqual(timeStampAfterRequest);
            expect(lastUpdateTimestamp).toBeGreaterThanOrEqual(timestampBeforeRequest);
            expect(lastUpdateTimestamp).toBeLessThanOrEqual(timeStampAfterRequest);

            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleResponse._id }).exec());
            compareVehicles(dto, vehicleInDb);

            const dealerAfter = assertNotNull(await Dealer.findOne({ _id: vehicleResponse.dealer }).exec());
            expectMongoArrayToContainId(dealerAfter.vehicles, vehicleInDb);
        });

        test('should return an error when no body provided', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const response = await vehicleController.create(null);
            expect(response).toMatchSnapshot();

            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.vehicleModel).toBe(vehicleToUpdate.vehicleModel);
        });

        test('should return an error when there are missing fields', async() => {
            const dto: any = {};
            const response = await vehicleController.create(JSON.stringify(dto));
            expect(response).toMatchSnapshot();
        });

        test('should return an error when trying to use an invalid value', async() => {
            const dealer = assertNotNull(await Dealer.findOne({}).exec());
            const dto: any = {
                make: 'make2',
                color: 'orange',
                dealer: dealer.id,
                fuelType: 'invalid-fuel-type',
                mileage: 4,
                vehicleModel: 'model3',
                transmission: 'automatic',
                vehicleType: 'other'
            };
            const response = await vehicleController.create(JSON.stringify(dto));
            expect(response).toMatchSnapshot();
        });

        test('should return an error when using an invalid dealer id', async() => {
            const dto: any = {
                make: 'make2',
                color: 'orange',
                dealer: 'not-an-id',
                fuelType: 'lpg',
                mileage: 4,
                vehicleModel: 'model3',
                transmission: 'automatic',
                vehicleType: 'other'
            };
            const response = await vehicleController.create(JSON.stringify(dto));
            expect(response).toMatchSnapshot();
        });
    });

    describe('removeVehicle()', () => {
        test('should remove the vehicle when the request is correct', async() => {
            const vehicleToRemove: VehicleDocument = assertNotNull(await Vehicle.findOne({}).populate('dealer').exec());
            const nVehiclesBefore = await Vehicle.count().exec();
            const response = await vehicleController.remove({ id: vehicleToRemove._id.toString() });
            const nVehiclesAfter = await Vehicle.count().exec();
            expect(response).toMatchSnapshot();

            const vehicleInDb = await Vehicle.findOne({ _id: vehicleToRemove._id }).exec();
            expect(vehicleInDb).toBeNull();
            expect(nVehiclesBefore).toBe(nVehiclesAfter + 1);

            const dealerAfter = assertNotNull(await Dealer.findOne({ _id: vehicleToRemove.dealer._id }).exec());
            expectMongoArrayNotToContainId(dealerAfter.vehicles, vehicleToRemove);
        });

        test('should return an error when no id provided', async() => {
            const nVehiclesBefore = await Vehicle.count().exec();
            const response = await vehicleController.remove({});
            const nVehiclesAfter = await Vehicle.count().exec();
            expect(response).toMatchSnapshot();
            expect(nVehiclesBefore).toBe(nVehiclesAfter);
        });

        test('should return an error when vehicle with id does not exist', async() => {
            const id = '754171318ce5b4f5098621cb';
            const nVehiclesBefore = await Vehicle.count().exec();
            const response = await vehicleController.remove({ id });
            const nVehiclesAfter = await Vehicle.count().exec();
            expect(response).toMatchSnapshot();
            expect(nVehiclesBefore).toBe(nVehiclesAfter);
        });
    });

    describe('updateVehicle()', () => {
        test('should update the vehicle when the request is correct', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const newDealerId = '754171318ce5b4f5098621cb';
            const newDealer = await new Dealer({
                _id: newDealerId,
                name: 'Dealer 3'
            }).save();

            const dto: UpdateVehicleDTO = {
                _id: vehicleToUpdate._id.toString(),
                vehicleModel: 'super model!',
                dealer: newDealerId
            };
            const timestampBeforeRequest = +Date.now();
            const response = await vehicleController.update(JSON.stringify(dto));
            const timeStampAfterRequest = +Date.now();
            const vehicleResponse = JSON.parse(response.body).data;
            expect(response.statusCode).toBe(200);

            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            compareVehicles(vehicleInDb, vehicleResponse);
            const lastUpdateTimestamp = +assertNotNull(vehicleInDb.lastUpdateDate);
            expect(lastUpdateTimestamp).toBeGreaterThanOrEqual(timestampBeforeRequest);
            expect(lastUpdateTimestamp).toBeLessThanOrEqual(timeStampAfterRequest);
            expect(vehicleInDb.vehicleModel).toBe(dto.vehicleModel);
            expect(getObjectIdAsString(vehicleInDb.dealer)).toBe(newDealerId);

            const dealerAfter = assertNotNull(await Dealer.findOne({ _id: newDealer.id }).exec());
            expectMongoArrayToContainId(dealerAfter.vehicles, vehicleInDb);

            const previousDealer = assertNotNull(await Dealer.findOne({ _id: vehicleToUpdate.dealer.id }).exec());
            expectMongoArrayNotToContainId(previousDealer.vehicles, vehicleInDb);
        });

        test('should return an error when no body provided', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const response = await vehicleController.update(null);
            expect(response).toMatchSnapshot();

            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.vehicleModel).toBe(vehicleToUpdate.vehicleModel);
        });

        test('should return an error when no id provided', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const dto: any = {
                vehicleModel: 'super model!'
            };
            const response = await vehicleController.update(JSON.stringify(dto));
            expect(response).toMatchSnapshot();

            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.vehicleModel).toBe(vehicleToUpdate.vehicleModel);
        });

        test('should return an error when vehicle with id does not exist', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const dto: UpdateVehicleDTO = {
                _id: '754171318ce5b4f5098621cb',
                vehicleModel: 'super model!'
            };
            const response = await vehicleController.update(JSON.stringify(dto));
            expect(response).toMatchSnapshot();

            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.vehicleModel).toBe(vehicleToUpdate.vehicleModel);
        });

        test('should return an error when using invalid fuel type', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const response = await vehicleController.update(JSON.stringify({
                _id: vehicleToUpdate._id.toString(),
                fuelType: 'invalid fuel type'
            }));
            expect(response).toMatchSnapshot();
            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.fuelType).toBe(vehicleToUpdate.fuelType);
        });

        test('should return an error when using invalid transmission', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const response = await vehicleController.update(JSON.stringify({
                _id: vehicleToUpdate._id.toString(),
                transmission: 'invalid transmission'
            }));
            expect(response).toMatchSnapshot();
            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.transmission).toBe(vehicleToUpdate.transmission);
        });

        test('should return an error when using mileage of wrong type', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const response = await vehicleController.update(JSON.stringify({
                _id: vehicleToUpdate._id.toString(),
                mileage: 'invalid mileage'
            }));
            expect(response).toMatchSnapshot();
            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.mileage).toBe(vehicleToUpdate.mileage);
        });

        test('should return an error with empty id', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const response = await vehicleController.update(JSON.stringify({
                _id: '',
                make: 'new make'
            }));
            expect(response).toMatchSnapshot();
            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.mileage).toBe(vehicleToUpdate.mileage);
        });

        test('should return an error with empty dealer id', async() => {
            const vehicleToUpdate = assertNotNull(await Vehicle.findOne({}).exec());
            const response = await vehicleController.update(JSON.stringify({
                _id: vehicleToUpdate._id.toString(),
                dealer: ''
            }));
            expect(response).toMatchSnapshot();
            const vehicleInDb = assertNotNull(await Vehicle.findOne({ _id: vehicleToUpdate._id }).exec());
            expect(vehicleInDb.mileage).toBe(vehicleToUpdate.mileage);
        });
    });
});
