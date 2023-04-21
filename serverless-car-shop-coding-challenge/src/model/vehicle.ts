import mongoose, { Schema } from 'mongoose';
import { type VehicleDocument, type VehicleModel, type VehicleSchema } from '../generated/mongoose.gen';
import { type components } from '../generated/openapi.js';

export type FuelType = components['schemas']['FuelType'];

export type VehicleType = components['schemas']['VehicleType'];

export const vehicleSchema: VehicleSchema = new Schema<VehicleDocument>({
    make: {
        type: String,
        required: true
    },
    // naming the property "model" makes it impossible to mock the module
    vehicleModel: {
        type: String,
        required: true
    },
    transmission: {
        type: String,
        required: true,
        enum: [
            'manual',
            'automatic',
            'semiAutomatic'
        ]
    },
    fuelType: {
        type: String,
        required: true,
        enum: [
            'petrol',
            'diesel',
            'eletric',
            'lpg',
            'hybrid'
        ] as FuelType
    },
    mileage: {
        type: Number,
        required: true
    },
    vehicleType: {
        type: String,
        required: true,
        enum: [
            'cabriolet',
            'coupe',
            'estateCar',
            'suv',
            'saloon',
            'van',
            'smallCar',
            'other'
        ] as VehicleType
    },
    color: {
        type: String,
        required: true
    },
    dealer: {
        type: Schema.Types.ObjectId,
        ref: 'Dealer',
        required: true
    }
}, {
    timestamps: {
        createdAt: 'creationDate',
        updatedAt: 'lastUpdateDate'
    }
});

export const Vehicle: VehicleModel = mongoose.model<VehicleDocument, VehicleModel>('Vehicle', vehicleSchema);
