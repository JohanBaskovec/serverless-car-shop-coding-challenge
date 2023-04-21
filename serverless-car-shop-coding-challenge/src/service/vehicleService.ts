import { Vehicle } from '../model/vehicle.js';
import { type CreateVehicleDTO, type UpdateVehicleDTO } from '../model/dto/vehicleDTO.js';
import { EntityDoesNotExistError, MissingKeyInJSONBodyError } from '../error/errors.js';
import { type DealerService } from './dealerService.js';
import { type DealerDocument, type VehicleDocument } from '../generated/mongoose.gen.js';
import mongoose from 'mongoose';
import { type CrudService } from './crudService.js';
import { type APIGatewayProxyEventQueryStringParameters } from 'aws-lambda/trigger/api-gateway-proxy.js';
import { type DeleteResponse } from '../model/response.js';

export class VehicleService implements CrudService<VehicleDocument, CreateVehicleDTO, UpdateVehicleDTO> {
    private _dealerService: DealerService;

    get dealerService(): DealerService {
        return this._dealerService;
    }

    set dealerService(value: DealerService) {
        this._dealerService = value;
    }

    async getAll(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null = null): Promise<VehicleDocument[]> {
        const params: any = {};
        if (queryStringParameters != null) {
            if (queryStringParameters.dealer != null) {
                params.dealer = queryStringParameters.dealer;
            }
        }
        return await Vehicle.find(params).exec();
    }

    async create(dto: CreateVehicleDTO): Promise<VehicleDocument> {
        const vehicle = await new Vehicle(dto).save();
        await this.dealerService.addVehicle(vehicle.dealer, vehicle, false);
        return vehicle;
    }

    async update(dto: UpdateVehicleDTO): Promise<VehicleDocument> {
        if (dto._id == null) {
            throw new MissingKeyInJSONBodyError(['_id']);
        }
        const vehicle = await Vehicle.findOne({ _id: dto._id }).exec();
        if (vehicle == null) {
            throw new EntityDoesNotExistError(`Vehicle with id ${dto._id} does not exist.`);
        }
        if (dto.dealer != null) {
            await this.setDealer(vehicle, new mongoose.Types.ObjectId(dto.dealer), true);
        }
        delete dto.dealer;
        const newVehicle = await Vehicle.findOneAndUpdate({ _id: dto._id }, dto, { new: true, runValidators: true }).exec();
        if (newVehicle == null) {
            throw new EntityDoesNotExistError(`Vehicle with id ${dto._id} does not exist.`);
        }
        return newVehicle;
    }

    async remove(id: string): Promise<DeleteResponse> {
        const vehicle = await Vehicle.findOne({ _id: id }).exec();
        if (vehicle == null) {
            throw new EntityDoesNotExistError(`Vehicle with id ${id} does not exist.`);
        }
        await this.dealerService.removeVehicle(vehicle.dealer, vehicle);
        return await Vehicle.deleteOne({ _id: id }).exec();
    }

    private async getVehicleDocument(vehicleOrVehicleId: VehicleDocument | mongoose.Types.ObjectId | string): Promise<VehicleDocument> {
        if (vehicleOrVehicleId instanceof mongoose.Types.ObjectId || typeof vehicleOrVehicleId === 'string') {
            const newVehicle = await Vehicle.findOne({ _id: vehicleOrVehicleId }).exec();
            if (newVehicle == null) {
                throw new EntityDoesNotExistError(`Vehicle with id ${vehicleOrVehicleId.toString()} does not exist.`);
            }
            return newVehicle;
        } else {
            return vehicleOrVehicleId;
        }
    }

    async setDealer(
        vehicleOrId: VehicleDocument | mongoose.Types.ObjectId,
        dealerOrId: DealerDocument | mongoose.Types.ObjectId,
        updateOppositeSide = false
    ): Promise<void> {
        const vehicle = await this.getVehicleDocument(vehicleOrId);

        await this.dealerService.removeVehicle(vehicle.dealer, vehicle);
        if (updateOppositeSide) {
            await this.dealerService.addVehicle(dealerOrId, vehicle, false);
        }

        vehicle.dealer = dealerOrId;
        await vehicle.save();
    }
}
