import { Dealer } from '../../src/model/dealer.js';
import { DealerService } from '../../src/service/dealerService.js';
import { type CreateDealerDTO, type UpdateDealerDTO } from '../../src/model/dto/dealerDTO.js';
import { EntityDoesNotExistError, MissingKeyInJSONBodyError } from '../../src/error/errors.js';
import { VehicleService } from '../../src/service/vehicleService.js';

jest.mock('../../src/model/dealer.js');
jest.mock('../../src/service/vehicleService.js');

const dealerService = new DealerService();
beforeEach(() => {
    (Dealer as any as jest.Mock).mockClear();
    dealerService.vehicleService = new VehicleService();
});

describe('dealerService', () => {
    describe('getAllDealers', () => {
        test('should return all dealers', async() => {
            const fakeExecResponse = [{ name: 'dealer0' }];
            Dealer.find = jest.fn().mockImplementation(() => {
                return {
                    exec: jest.fn().mockReturnValueOnce(Promise.resolve(fakeExecResponse))
                };
            });

            const response = await dealerService.getAll();
            expect(response).toBe(fakeExecResponse);
        });
    });
    describe('createDealer', () => {
        test('should create a dealer', async() => {
            const mockPopulate = jest.fn();
            const mockVehicle1 = {};
            const mockVehicle2 = {};
            const mockDealer = {
                populate: mockPopulate,
                vehicles: [mockVehicle1, mockVehicle2]
            };
            const mockDealerConstructor = {
                save: jest.fn().mockReturnValue(mockDealer)
            };
            (Dealer as any as jest.Mock).mockReturnValue(mockDealerConstructor);

            const response = await dealerService.create({} as CreateDealerDTO);
            expect(Dealer).toHaveBeenCalledTimes(1);
            expect(dealerService.vehicleService.setDealer).toHaveBeenCalledTimes(2);
            expect(response).toBe(mockDealer);
        });
    });
    describe('updateDealer', () => {
        test('should throw MissingKeyInJSONBodyError if missing id', async() => {
            await expect(async() => {
                return await dealerService.update({ name: 'hello' } as UpdateDealerDTO);
            }).rejects.toThrow(MissingKeyInJSONBodyError);
            expect(Dealer.findOneAndUpdate).toHaveBeenCalledTimes(0);
        });
        test("should throw EntityDoesNotExistError if dealer doesn't exist", async() => {
            Dealer.findOneAndUpdate = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(null)
            });
            await expect(async() => {
                return await dealerService.update({ name: 'hello', _id: 'some-id' } as UpdateDealerDTO);
            }).rejects.toThrow(EntityDoesNotExistError);
            expect(Dealer.findOneAndUpdate).toHaveBeenCalledTimes(1);
        });
        test('should update if dealer exists', async() => {
            const mockValue = { name: 'test' };
            Dealer.findOneAndUpdate = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockValue)
            });

            const response = await dealerService.update({ name: 'hello', _id: 'some-id' } as UpdateDealerDTO);
            expect(response).toBe(mockValue);
            expect(Dealer.findOneAndUpdate).toHaveBeenCalledTimes(1);
        });
    });
    describe('removeDealer', () => {
        test("should throw EntityDoesNotExistError if dealer doesn't exist", async() => {
            const mockDealer = {
                vehicles: []
            };
            Dealer.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockDealer)
            });
            Dealer.deleteOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue({
                    deletedCount: 0
                })
            });
            await expect(async() => {
                return await dealerService.remove('id');
            }).rejects.toThrow(EntityDoesNotExistError);
        });
        test('should return Mongoose response if the dealer was deleted', async() => {
            const mockDealer = {
                vehicles: []
            };
            Dealer.findOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockDealer)
            });
            const mockResponse = { deletedCount: 1 };
            Dealer.deleteOne = jest.fn().mockReturnValue({
                exec: jest.fn().mockReturnValue(mockResponse)
            });
            const response = await dealerService.remove('id');
            expect(response).toBe(mockResponse);
        });
    });
});
