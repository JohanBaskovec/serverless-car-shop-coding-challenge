import { connect, type Mongoose } from 'mongoose';

export async function connectToMongo(): Promise<Mongoose> {
    if (process.env.DB_URL == null) {
        throw new Error('process.env.DB_URL must be defined.');
    }
    return await connect(process.env.DB_URL);
}
