import { type CreateVehicleDTO, type UpdateVehicleDTO } from '../model/dto/vehicleDTO.js';
import { CrudController } from './crudController.js';
import { type VehicleDocument } from '../generated/mongoose.gen.js';

export class VehicleController extends CrudController<VehicleDocument, CreateVehicleDTO, UpdateVehicleDTO> {
}
