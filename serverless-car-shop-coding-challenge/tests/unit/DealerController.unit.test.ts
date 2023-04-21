import { DealerController } from '../../src/controller/dealerController.js';
import { type DealerService } from '../../src/service/dealerService.js';
import mongoose from 'mongoose';
import { EntityDoesNotExistError, MissingPathParametersError } from '../../src/error/errors.js';

describe('dealerController', () => {
    describe('getAll', () => {
        test('should return dealers', async() => {
            const service = {
                getAll: jest.fn().mockReturnValue([])
            } as any as DealerService;
            const controller = new DealerController(service);
            const response = await controller.getAll();
            expect(service.getAll).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
    });
    describe('create', () => {
        test('should create dealer when request is valid', async() => {
            const fakeNewDealer = {
                id: 'dealer-id',
                name: 'dealer-name'
            };
            const service = {
                create: jest.fn().mockImplementation(() => {
                    return fakeNewDealer;
                })
            } as any as DealerService;
            const controller = new DealerController(service);
            const response = await controller.create(JSON.stringify({}));
            expect(service.create).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
        test('should return an error when request is invalid', async() => {
            const service = {
                create: jest.fn().mockImplementation(() => {
                    throw new mongoose.Error.ValidationError();
                })
            } as any as DealerService;
            const controller = new DealerController(service);
            const response = await controller.create(JSON.stringify({}));
            expect(service.create).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
    });
    describe('update', () => {
        test('should update dealer when request is valid', async() => {
            const fakeNewDealer = {
                id: 'dealer-id',
                name: 'dealer-name'
            };
            const service = {
                update: jest.fn().mockImplementation(() => {
                    return fakeNewDealer;
                })
            } as any as DealerService;
            const controller = new DealerController(service);
            const response = await controller.update(JSON.stringify({}));
            expect(service.update).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
        test('should return an error when request is invalid', async() => {
            const service = {
                update: jest.fn().mockImplementation(() => {
                    throw new mongoose.Error.ValidationError();
                })
            } as any as DealerService;
            const controller = new DealerController(service);
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
            } as any as DealerService;
            const controller = new DealerController(service);
            const response = await controller.remove({});
            expect(service.remove).toHaveBeenCalledTimes(0);
            expect(response).toMatchSnapshot();
        });
        test('should remove dealer when request is valid', async() => {
            const service = {
                remove: jest.fn().mockImplementation(() => {
                    return { name: 'response from Mango' };
                })
            } as any as DealerService;
            const controller = new DealerController(service);
            const response = await controller.remove({ id: 'an id' });
            expect(service.remove).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
        test("should return an error when dealer doesn't exist", async() => {
            const service = {
                remove: jest.fn().mockImplementation(() => {
                    throw new EntityDoesNotExistError("Dealer doesn't exist");
                })
            } as any as DealerService;
            const controller = new DealerController(service);
            const response = await controller.remove({ id: 'an id' });
            expect(service.remove).toHaveBeenCalledTimes(1);
            expect(response).toMatchSnapshot();
        });
    });
});
