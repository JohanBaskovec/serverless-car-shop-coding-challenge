import mongoose, { Schema } from 'mongoose';
import { type DealerDocument, type DealerModel, type DealerSchema } from '../generated/mongoose.gen.js';

export const dealerSchema: DealerSchema = new Schema<DealerDocument>({
    name: {
        type: String,
        required: true
    },
    vehicles: [{
        type: Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true
    }]
}, {
    timestamps: {
        createdAt: 'creationDate',
        updatedAt: 'lastUpdateDate'
    }
});

export const Dealer: DealerModel = mongoose.model<DealerDocument, DealerModel>('Dealer', dealerSchema);
