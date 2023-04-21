import mongoose from 'mongoose';
import { EntityDoesNotExistError, MissingPathParametersError } from '../../src/error/errors.js';
import { type VehicleService } from '../../src/service/vehicleService.js';
import { VehicleController } from '../../src/controller/vehicleController.js';

describe('vehicleController', () => {
    describe('getAll', () => {
        test('should return vehicles', async() => {
            const service = {
                getAll: jest.fn().mockReturnValue([])
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.getAll();
            expect(service.getAll).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
    });
    describe('create', () => {
        test('should create vehicle when request is valid', async() => {
            const fakeNewVehicle = {
                id: 'vehicle-id',
                name: 'vehicle-name'
            };
            const service = {
                create: jest.fn().mockImplementation(() => {
                    return fakeNewVehicle;
                })
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.create(JSON.stringify({}));
            expect(service.create).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
        test('should return an error when request is invalid', async() => {
            const service = {
                create: jest.fn().mockImplementation(() => {
                    throw new mongoose.Error.ValidationError();
                })
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.create(JSON.stringify({}));
            expect(service.create).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
    });
    describe('update', () => {
        test('should update vehicle when request is valid', async() => {
            const fakeNewVehicle = {
                id: 'vehicle-id',
                name: 'vehicle-name'
            };
            const service = {
                update: jest.fn().mockImplementation(() => {
                    return fakeNewVehicle;
                })
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.update(JSON.stringify({}));
            expect(service.update).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
        test('should return an error when request is invalid', async() => {
            const service = {
                update: jest.fn().mockImplementation(() => {
                    throw new mongoose.Error.ValidationError();
                })
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.update(JSON.stringify({}));
            expect(service.update).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
    });
    describe('remove', () => {
        test('should return an error when id is missing', async() => {
            const service = {
                remove: jest.fn().mockImplementation(() => {
                    throw new MissingPathParametersError(['id']);
                })
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.remove({});
            expect(service.remove).toHaveBeenCalledTimes(0);
            expect(response).toMatchSnapshot();
        });
        test('should remove vehicle when request is valid', async() => {
            const service = {
                remove: jest.fn().mockImplementation(() => {
                    return { name: 'response from Mango' };
                })
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.remove({ id: 'an id' });
            expect(service.remove).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
        test("should return an error when vehicle doesn't exist", async() => {
            const service = {
                remove: jest.fn().mockImplementation(() => {
                    throw new EntityDoesNotExistError("Vehicle doesn't exist");
                })
            } as any as VehicleService;
            const controller = new VehicleController(service);
            const response = await controller.remove({ id: 'an id' });
            expect(service.remove).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
    });
});
