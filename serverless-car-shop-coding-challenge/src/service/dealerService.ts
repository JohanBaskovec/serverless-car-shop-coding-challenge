import { Dealer } from '../model/dealer.js';
import { type CreateDealerDTO, type UpdateDealerDTO } from '../model/dto/dealerDTO.js';
import { ConstraintError, EntityDoesNotExistError, MissingKeyInJSONBodyError } from '../error/errors.js';
import mongoose from 'mongoose';
import { type VehicleService } from './vehicleService.js';
import { type DealerDocument, type VehicleDocument } from '../generated/mongoose.gen.js';
import { type CrudService } from './crudService.js';
import { type APIGatewayProxyEventQueryStringParameters } from 'aws-lambda/trigger/api-gateway-proxy.js';
import { type DeleteResponse } from '../model/response.js';

export class DealerService implements CrudService<DealerDocument, CreateDealerDTO, UpdateDealerDTO> {
    private _vehicleService: VehicleService;

    get vehicleService(): VehicleService {
        return this._vehicleService;
    }

    set vehicleService(value: VehicleService) {
        this._vehicleService = value;
    }

    async getAll(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null = null): Promise<DealerDocument[]> {
        return await Dealer.find({}).exec();
    }

    async create(dto: CreateDealerDTO): Promise<DealerDocument> {
        const dealer = await new Dealer(dto).save();
        for (const vehicle of dealer.vehicles) {
            await this.vehicleService.setDealer(vehicle, dealer, false);
        }
        return dealer;
    }

    async update(dto: UpdateDealerDTO): Promise<DealerDocument> {
        if (dto._id == null) {
            throw new MissingKeyInJSONBodyError(['_id']);
        }
        if (dto.vehicles != null) {
            await this.setVehicles(
                new mongoose.Types.ObjectId(dto._id),
                dto.vehicles.map(v => new mongoose.Types.ObjectId(v)),
                true
            );
        }
        delete dto.vehicles;
        const dealer = await Dealer.findOneAndUpdate({ _id: dto._id }, dto, { new: true, runValidators: true }).exec();
        if (dealer == null) {
            throw new EntityDoesNotExistError(`Dealer with id ${dto._id} does not exist.`);
        }
        return dealer;
    }

    async remove(id: string): Promise<DeleteResponse> {
        const dealer: DealerDocument | null = await Dealer.findOne({ _id: id }).exec();
        if (dealer == null) {
            throw new EntityDoesNotExistError(`Dealer with id ${id} does not exist.`);
        }
        if ((dealer.vehicles as mongoose.Types.ObjectId[]).length !== 0) {
            throw new ConstraintError('Dealer has vehicles, delete them first before deleting the dealer.');
        }
        const response = await Dealer.deleteOne({ _id: id }).exec();
        if (response.deletedCount === 0) {
            throw new EntityDoesNotExistError(`Dealer with id ${id} does not exist.`);
        }
        return response;
    }

    async removeVehicle(
        dealerOrId: DealerDocument | mongoose.Types.ObjectId,
        vehicle: mongoose.Types.ObjectId | VehicleDocument
    ): Promise<void> {
        const dealer = await this.getDealerDocument(dealerOrId);
        dealer.vehicles.pull(vehicle);
        await dealer.save();
    }

    async setVehicles(
        dealerOrId: DealerDocument | mongoose.Types.ObjectId,
        vehiclesToSet: Array<VehicleDocument | mongoose.Types.ObjectId>,
        updateOppositeSide = false
    ): Promise<void> {
        const dealer: DealerDocument = await this.getDealerDocument(dealerOrId);
        const vehiclesToAdd: Array<mongoose.Types.ObjectId | VehicleDocument> = [];
        // First we check if array contains new vehicles
        for (const vehicleToSet of vehiclesToSet) {
            let hasVehicle = false;
            for (const vehicle of dealer.vehicles) {
                if (vehicleToSet._id.equals(vehicle._id)) {
                    hasVehicle = true;
                    break;
                }
            }
            if (!hasVehicle) {
                vehiclesToAdd.push(vehicleToSet._id);
            }
        }
        // Then we check if any vehicle would be deleted from current list of vehicles
        for (const vehicle of dealer.vehicles) {
            let hasVehicle = false;
            for (const vehicleToSet of vehiclesToSet) {
                if (vehicleToSet._id.equals(vehicle._id)) {
                    hasVehicle = true;
                    break;
                }
            }
            if (!hasVehicle) {
                throw new ConstraintError(`Impossible to delete vehicle ${vehicle._id.toString()} from the dealer, as it wouldn't belong to a dealer anymore.`);
            }
        }
        dealer.vehicles.addToSet(...vehiclesToAdd);
        await dealer.save();
        if (updateOppositeSide) {
            for (const vehicle of vehiclesToAdd) {
                await this.vehicleService.setDealer(vehicle, dealer, false);
            }
        }
    }

    async addVehicles(
        dealerOrId: DealerDocument | mongoose.Types.ObjectId,
        vehicles: Array<VehicleDocument | mongoose.Types.ObjectId>,
        updateOppositeSide = false
    ): Promise<void> {
        const dealer = await this.getDealerDocument(dealerOrId);
        const ids: mongoose.Types.ObjectId[] = [];
        for (const vehicle of vehicles) {
            if (vehicle instanceof mongoose.Types.ObjectId) {
                ids.push(vehicle);
            } else {
                ids.push(vehicle._id);
            }
        }
        dealer.vehicles.addToSet(ids);
        await dealer.save();
        if (updateOppositeSide) {
            for (const vehicle of vehicles) {
                await this.vehicleService.setDealer(vehicle, dealer, false);
            }
        }
    }

    async addVehicle(
        dealerOrId: DealerDocument | mongoose.Types.ObjectId,
        vehicle: VehicleDocument | mongoose.Types.ObjectId,
        updateOppositeSide = false
    ): Promise<void> {
        await this.addVehicles(dealerOrId, [vehicle], updateOppositeSide);
    }

    async getDealerDocument(dealerOrDealerId: DealerDocument | mongoose.Types.ObjectId): Promise<DealerDocument> {
        if (dealerOrDealerId instanceof mongoose.Types.ObjectId) {
            const newDealer = await Dealer.findOne({ _id: dealerOrDealerId }).exec();
            if (newDealer == null) {
                throw new EntityDoesNotExistError(`Dealer with id ${dealerOrDealerId.toString()} does not exist.`);
            }
            return newDealer;
        } else {
            return dealerOrDealerId;
        }
    }
}
