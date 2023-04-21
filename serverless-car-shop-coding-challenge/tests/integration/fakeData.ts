import { Dealer } from '../../src/model/dealer.js';
import { Vehicle } from '../../src/model/vehicle.js';

export async function resetDatabase(): Promise<void> {
    await Dealer.deleteMany({}).exec();
    await Vehicle.deleteMany({}).exec();

    const dealer1 = await new Dealer({
        _id: '644171318ce5b4f5098621cb',
        creationDate: new Date('2009-10-10'),
        lastUpdateDate: new Date('2009-10-10'),
        name: 'Dealer 1'
    }).save();
    const dealer2 = await new Dealer({
        _id: '644171318ce5b4f5098621ca',
        creationDate: new Date('2008-10-10'),
        lastUpdateDate: new Date('2008-10-10'),
        name: 'Dealer 2'
    }).save();

    const vehicle1 = await new Vehicle({
        _id: '644170e85d3ab81e12fcca7c',
        creationDate: new Date('2010-10-10'),
        lastUpdateDate: new Date('2010-10-10'),
        make: 'make1',
        vehicleModel: 'model1',
        transmission: 'manual',
        fuelType: 'lpg',
        mileage: 0,
        vehicleType: 'coupe',
        color: 'blue',
        dealer: dealer1.id
    }).save();
    dealer1.vehicles.addToSet(vehicle1);

    const vehicle2 = await new Vehicle({
        _id: '644170e85d3ab81e12fcca7e',
        creationDate: new Date('2012-10-10'),
        lastUpdateDate: new Date('2012-10-10'),
        make: 'make2',
        vehicleModel: 'model2',
        transmission: 'automatic',
        fuelType: 'lpg',
        mileage: 10,
        vehicleType: 'van',
        color: 'red',
        dealer: dealer1.id
    }).save();
    dealer1.vehicles.addToSet(vehicle2);

    const vehicle3 = await new Vehicle({
        _id: '644170e85d3ab81e12fcca7f',
        creationDate: new Date('2011-10-10'),
        lastUpdateDate: new Date('2011-10-10'),
        make: 'make2',
        vehicleModel: 'model2',
        transmission: 'automatic',
        fuelType: 'lpg',
        mileage: 10,
        vehicleType: 'van',
        color: 'red',
        dealer: dealer2.id
    }).save();
    dealer2.vehicles.addToSet(vehicle3);
    await dealer1.save({ timestamps: false });
    await dealer2.save({ timestamps: false });
}
