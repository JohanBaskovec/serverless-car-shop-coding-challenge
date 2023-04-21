import { Vehicle } from '../../src/model/vehicle.js';
import { VehicleService } from '../../src/service/vehicleService.js';
import { EntityDoesNotExistError, MissingKeyInJSONBodyError } from '../../src/error/errors.js';
import { type CreateVehicleDTO, type UpdateVehicleDTO } from '../../src/model/dto/vehicleDTO.js';
import { Dealer } from '../../src/model/dealer.js';
import { DealerService } from '../../src/service/dealerService.js';
import mongoose from 'mongoose';

jest.mock('../../src/model/vehicle.js');
jest.mock('../../src/model/dealer.js');
jest.mock('../../src/service/dealerService.js');

const vehicleService = new VehicleService();
beforeEach(() => {
    (Vehicle as any as jest.Mock).mockClear();
    (Dealer as any as jest.Mock).mockClear();
    vehicleService.dealerService = new DealerService();
});

describe('vehicleService', () => {
    describe('getAllVehicles', () => {
        test('should return all vehicles', async() => {
            const fakeExecResponse = [{ name: 'vehicle0' }];
            Vehicle.find = jest.fn().mockImplementation(() => {
                return {
                    exec: jest.fn().mockReturnValueOnce(Promise.resolve(fakeExecResponse))
                };
            });

            const response = await vehicleService.getAll();
            expect(response).toBe(fakeExecResponse);
        });
    });
    describe('createVehicle', () => {
        test('should create a vehicle', async() => {
            const mockVehicle = { name: 'vehicle0', dealer: 'dealer-id' };
            const mockSave = jest.fn().mockImplementation(async() => await Promise.resolve(mockVehicle));
            (Vehicle as any as jest.Mock).mockImplementation(() => {
                return {
                    save: mockSave
                };
            });
            const mockAddToSet = jest.fn();
            const mockDealerSave = jest.fn();
            Dealer.findOne = jest.fn().mockReturnValue({
                vehicles: {
                    addToSet: mockAddToSet
                },
                save: mockDealerSave
            });

            const response = await vehicleService.create({} as CreateVehicleDTO);
            expect(Vehicle).toHaveBeenCalledTimes(1);
            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(vehicleService.dealerService.addVehicle)
                .toHaveBeenCalledWith(mockVehicle.dealer, mockVehicle, false);
            expect(response).toBe(mockVehicle);
        });
    });
    describe('updateVehicle', () => {
        test('should throw MissingKeyInJSONBodyError if missing id', async() => {
            await expect(async() => {
                return await vehicleService.update({ model: 'hello' } as any as UpdateVehicleDTO);
            }).rejects.toThrow(MissingKeyInJSONBodyError);
            expect(Vehicle.findOneAndUpdate).toHaveBeenCalledTimes(0);
        });
        test("should throw EntityDoesNotExistError if vehicle doesn't exist", async() => {
            Vehicle.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(null)
            });
            await expect(async() => {
                return await vehicleService.update({ name: 'hello', _id: 'some-id' } as UpdateVehicleDTO);
            }).rejects.toThrow(EntityDoesNotExistError);
            expect(Vehicle.findOne).toHaveBeenCalledTimes(1);
        });
        test('should update if vehicle exists', async() => {
            const mockReturnValue = { name: 'test' };
            const mockSave = jest.fn();
            const previousDealerId = 'some-id';
            const mockVehicle = {
                save: mockSave,
                dealer: previousDealerId
            };
            const mockPreviousDealer = {};
            const mockNewDealer = {};
            Vehicle.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockVehicle)
            });
            Dealer.findOne = jest.fn().mockReturnValueOnce({
                exec: jest.fn().mockReturnValue(mockPreviousDealer)
            }).mockReturnValueOnce({
                exec: jest.fn().mockReturnValue(mockNewDealer)
            });
            Vehicle.findOneAndUpdate = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockReturnValue)
            });

            const newDealerId = '123456789012';
            const response = await vehicleService.update({
                name: 'hello',
                _id: 'some-id',
                dealer: newDealerId
            } as UpdateVehicleDTO);

            expect(response).toBe(mockReturnValue);
            expect(Vehicle.findOneAndUpdate).toHaveBeenCalledTimes(1);
            expect(vehicleService.dealerService.removeVehicle).toHaveBeenCalledTimes(1);
            expect(vehicleService.dealerService.removeVehicle).toHaveBeenCalledWith(previousDealerId, mockVehicle);
            expect(vehicleService.dealerService.addVehicle).toHaveBeenCalledTimes(1);
            expect(vehicleService.dealerService.addVehicle).toHaveBeenCalledWith(new mongoose.Types.ObjectId(newDealerId), mockVehicle, false);
            expect(mockSave).toHaveBeenCalledTimes(1);
        });
    });
    describe('removeVehicle', () => {
        test("should throw EntityDoesNotExistError if vehicle doesn't exist", async() => {
            Vehicle.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(null)
            });
            await expect(async() => {
                return await vehicleService.remove('id');
            }).rejects.toThrow(EntityDoesNotExistError);
        });
        test('should remove the vehicle if it exists and update the linked Dealer', async() => {
            const mockResponse = { deletedCount: 1 };
            const mockVehicle = { dealer: 'some-dealer' };
            Vehicle.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockVehicle)
            });
            Vehicle.deleteOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockResponse)
            });
            const response = await vehicleService.remove('id');
            expect(vehicleService.dealerService.removeVehicle)
                .toHaveBeenCalledWith(mockVehicle.dealer, mockVehicle);
            expect(response).toBe(mockResponse);
        });
    });
});
