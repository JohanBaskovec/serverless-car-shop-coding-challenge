import { type CreateDealerDTO, type UpdateDealerDTO } from '../model/dto/dealerDTO.js';
import { CrudController } from './crudController.js';
import { type DealerDocument } from '../generated/mongoose.gen.js';

export class DealerController extends CrudController<DealerDocument, CreateDealerDTO, UpdateDealerDTO> {
}
