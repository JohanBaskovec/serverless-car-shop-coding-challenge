import { Dealer } from '../../src/model/dealer.js';
import { connectToMongo } from '../../src/model/mongoose-db.js';
import { initializeEnvironmentVariables } from '../../src/utils/configuration.js';
import { type DealerDocument } from '../../src/generated/mongoose.gen.js';
import mongoose from 'mongoose';
import { DealerController } from '../../src/controller/dealerController.js';
import { DealerService } from '../../src/service/dealerService.js';
import { type CreateDealerDTO, type UpdateDealerDTO } from '../../src/model/dto/dealerDTO.js';
import { resetDatabase } from './fakeData.js';
import { assertNotNull } from '../utils/assert.js';
import { Vehicle } from '../../src/model/vehicle.js';
import { VehicleService } from '../../src/service/vehicleService.js';
import {
    asJavascriptArray,
    expectMongoArrayNotToContainId,
    expectMongoArrayToContainId,
    getObjectIdAsString
} from './utils.js';

beforeAll(async() => {
    initializeEnvironmentVariables();
    await connectToMongo();
});

afterAll(async() => {
    await mongoose.disconnect();
});

function compareDealers(a: CreateDealerDTO | DealerDocument | null, b: CreateDealerDTO | DealerDocument | null): void {
    a = assertNotNull(a);
    b = assertNotNull(b);
    expect(a.name).toEqual(b.name);
}

const dealerService = new DealerService();
const vehicleService = new VehicleService();
dealerService.vehicleService = vehicleService;
vehicleService.dealerService = dealerService;
const dealerController = new DealerController(dealerService);

beforeEach(async() => {
    await resetDatabase();
});

describe('DealerController', () => {
    describe('getAllDealers()', () => {
        test('should return an empty array if there are no dealers', async() => {
            await Dealer.deleteMany({}).exec();
            const response = await dealerController.getAll();
            expect(response).toMatchSnapshot();
        });

        test('should return dealers when there are dealers', async() => {
            const response = await dealerController.getAll();
            expect(response).toMatchSnapshot();
        });
    });

    describe('createDealer()', () => {
        test('should create a dealer when the request is correct', async() => {
            // We create a new dealer and move a vehicle from an existing dealer to it
            const previousDealer = assertNotNull(await Dealer.findOne({}).exec());
            const vehicle = assertNotNull(await Vehicle.findOne({ dealer: previousDealer._id }).exec());
            const dto: CreateDealerDTO = {
                name: 'name1',
                vehicles: [vehicle._id.toString()]
            };
            const timestampBeforeRequest = +Date.now();
            const response = await dealerController.create(JSON.stringify(dto));
            const timeStampAfterRequest = +Date.now();
            expect(response.statusCode).toBe(200);

            const dealerResponse = JSON.parse(response.body).data;
            compareDealers(dealerResponse, dto);
            const creationDateTimestamp = +new Date(dealerResponse.creationDate);
            const lastUpdateTimestamp = +new Date(dealerResponse.lastUpdateDate);
            expect(creationDateTimestamp).toBeGreaterThanOrEqual(timestampBeforeRequest);
            expect(creationDateTimestamp).toBeLessThanOrEqual(timeStampAfterRequest);
            expect(lastUpdateTimestamp).toBeGreaterThanOrEqual(timestampBeforeRequest);
            expect(lastUpdateTimestamp).toBeLessThanOrEqual(timeStampAfterRequest);

            const dealerInDb = assertNotNull(await Dealer.findOne({ _id: dealerResponse._id }).exec());
            compareDealers(dto, dealerInDb);
            expectMongoArrayToContainId(dealerInDb.vehicles, vehicle);
            const previousDealerAfterUpdate = assertNotNull(await Dealer.findOne({ _id: previousDealer._id }).exec());
            expectMongoArrayNotToContainId(previousDealerAfterUpdate.vehicles, vehicle);

            const vehicleAfter = assertNotNull(await Vehicle.findOne({ _id: vehicle._id }).exec());
            expect(getObjectIdAsString(vehicleAfter.dealer)).toBe(dealerInDb._id.toString());
        });

        test('should return an error when there are missing fields', async() => {
            const dto: any = {};
            const response = await dealerController.create(JSON.stringify(dto));
            expect(response).toMatchSnapshot();
        });

        test('should return an error when using string type for vehicles', async() => {
            const dto: any = { vehicles: '' };
            const response = await dealerController.create(JSON.stringify(dto));
            expect(response).toMatchSnapshot();
        });

        test('should return an error when using an invalid vehicles id', async() => {
            const dto: any = {
                vehicles: ['not-an-id']
            };
            const response = await dealerController.create(JSON.stringify(dto));
            expect(response).toMatchSnapshot();
        });
    });

    describe('removeDealer()', () => {
        test('should remove the dealer when the request is correct', async() => {
            const dealerToRemove = await new Dealer({ name: 'dealer!' }).save();
            const nDealersBefore = await Dealer.count().exec();
            const response = await dealerController.remove({ id: dealerToRemove._id.toString() });
            const nDealersAfter = await Dealer.count().exec();
            expect(response).toMatchSnapshot();

            const dealerInDb = await Dealer.findOne({ _id: dealerToRemove._id }).exec();
            expect(dealerInDb).toBeNull();
            expect(nDealersBefore).toBe(nDealersAfter + 1);
        });

        test('should return an error when trying to delete a dealer that has vehicles', async() => {
            // a Vehicle MUST HAVE a dealer, therefore it's an error to delete a Dealer that has vehicles
            const nDealersBefore = await Dealer.count().exec();
            const dealerWithVehicles = assertNotNull(await Dealer.findOne({ vehicles: { $exists: true, $ne: [] } }).exec());
            const response = await dealerController.remove({ id: dealerWithVehicles._id.toString() });
            const nDealersAfter = await Dealer.count().exec();
            expect(response.statusCode).toBe(400);
            expect(response).toMatchSnapshot();
            expect(nDealersBefore).toBe(nDealersAfter);
        });

        test('should return an error when no id provided', async() => {
            const nDealersBefore = await Dealer.count().exec();
            const response = await dealerController.remove({});
            const nDealersAfter = await Dealer.count().exec();
            expect(response).toMatchSnapshot();
            expect(nDealersBefore).toBe(nDealersAfter);
        });

        test('should return an error when dealer with id does not exist', async() => {
            const id = '754171318ce5b4f5098621cb';
            const nDealersBefore = await Dealer.count().exec();
            const response = await dealerController.remove({ id });
            const nDealersAfter = await Dealer.count().exec();
            expect(response).toMatchSnapshot();
            expect(nDealersBefore).toBe(nDealersAfter);
        });
    });

    describe('updateDealer()', () => {
        test("should update the dealer when the request is correct, and the vehicle that's been transferred from another dealer ", async() => {
            const dealerToUpdate = assertNotNull(await Dealer.findOne({}).exec());
            const vehicleOfOtherDealer = assertNotNull(await Vehicle.findOne({ dealer: { $ne: dealerToUpdate._id } }).exec());
            const dto: UpdateDealerDTO = {
                _id: dealerToUpdate._id.toString(),
                name: 'super name!',
                vehicles: [...asJavascriptArray(dealerToUpdate.vehicles).map(v => v._id.toString()), vehicleOfOtherDealer._id.toString()]
            };
            const timestampBeforeRequest = +Date.now();

            const response = await dealerController.update(JSON.stringify(dto));

            expect(response.statusCode).toBe(200);
            const timeStampAfterRequest = +Date.now();
            const dealerResponse = JSON.parse(response.body).data;
            expect(dealerResponse.name).toBe(dto.name);

            const dealerInDb = assertNotNull(await Dealer.findOne({ _id: dealerToUpdate._id }).exec());
            compareDealers(dealerInDb, dealerResponse);
            const creationTimestamp = +assertNotNull(dealerInDb.creationDate);
            expect(creationTimestamp).toBeLessThan(timestampBeforeRequest);
            const lastUpdateTimestamp = +assertNotNull(dealerInDb.lastUpdateDate);
            expect(lastUpdateTimestamp).toBeGreaterThanOrEqual(timestampBeforeRequest);
            expect(lastUpdateTimestamp).toBeLessThanOrEqual(timeStampAfterRequest);
            expect(dealerInDb.name).toBe(dto.name);

            expectMongoArrayToContainId(dealerInDb.vehicles, vehicleOfOtherDealer);
            const previousDealer = assertNotNull(await Dealer.findOne({ _id: vehicleOfOtherDealer.dealer }).exec());
            expectMongoArrayNotToContainId(previousDealer.vehicles, vehicleOfOtherDealer);

            const vehicleAfter = assertNotNull(await Vehicle.findOne({ _id: vehicleOfOtherDealer._id }).exec());
            expect(getObjectIdAsString(vehicleAfter.dealer)).toBe(dealerInDb._id.toString());
        });

        test('should return an error when removing vehicles', async() => {
            // Vehicles should always have a dealer, therefore it's an error to remove a vehicle from a dealer,
            // because we don't know which dealer the vehicle should belong to
            const dealer = assertNotNull(await Dealer.findOne({ _id: '644171318ce5b4f5098621cb' }).exec());
            const dto: any = {
                _id: dealer._id,
                vehicles: ['644170e85d3ab81e12fcca7e']
            };
            const response = await dealerController.update(JSON.stringify(dto));
            expect(response).toMatchSnapshot();
        });

        test('should return an error when dealer with id does not exist', async() => {
            const dealerToUpdate = assertNotNull(await Dealer.findOne({}).exec());
            const dto: UpdateDealerDTO = {
                _id: '754171318ce5b4f5098621cb',
                name: 'super name!'
            };
            const response = await dealerController.update(JSON.stringify(dto));
            expect(response).toMatchSnapshot();

            const dealerInDb = assertNotNull(await Dealer.findOne({ _id: dealerToUpdate._id }).exec());
            expect(dealerInDb.name).toBe(dealerToUpdate.name);
        });
    });
});
