import mongoose from 'mongoose';

/*
Cast a mongoose array into a native Javascript array of ObjectId,
throw an Error if it's not the right type.

mongoose.Types.Array is the available global Array, but Typescript isn't smart enough to know the exact type,
for example it thinks that it doesn't have the method map(), even though it does in Node. We use this
function to force Typescript to know the real type of the array.
 */
export function asJavascriptArray(
    arr: mongoose.Types.Array<mongoose.Types.ObjectId | mongoose.Document> | Array<mongoose.Types.ObjectId | mongoose.Document>
): Array<mongoose.Types.ObjectId | mongoose.Document> {
    if (!(arr instanceof Array)) {
        throw new Error('mongoose.Types.Array is not a Javascript Array, that should never happen.');
    }
    return arr;
}

export function getObjectIdAsString(documentOrId: mongoose.Types.ObjectId | mongoose.Document | string): string {
    if (documentOrId instanceof mongoose.Types.ObjectId || documentOrId instanceof mongoose.Document) {
        return documentOrId._id.toString();
    } else {
        return documentOrId;
    }
}

export function mongoArrayContainsId(
    array: mongoose.Types.Array<mongoose.Types.ObjectId | mongoose.Document>,
    document: mongoose.Types.ObjectId | mongoose.Document
): boolean {
    const arr: Array<mongoose.Types.ObjectId | mongoose.Document> = asJavascriptArray(array);
    let containId = false;
    for (const elem of arr) {
        const a: mongoose.Types.ObjectId = elem._id;
        const b: mongoose.Types.ObjectId = document._id;
        if (a.equals(b)) {
            containId = true;
        }
    }
    return containId;
}

export function expectMongoArrayToContainId(
    array: mongoose.Types.Array<mongoose.Types.ObjectId | mongoose.Document>,
    document: mongoose.Types.ObjectId | mongoose.Document
): void {
    const containId = mongoArrayContainsId(array, document);

    if (!containId) {
        const id: string = document._id.toString();
        throw new Error(`Expected array to contain Document or ObjectId "${id}", but it doesn't.`);
    }
}

export function expectMongoArrayNotToContainId(
    array: mongoose.Types.Array<mongoose.Types.ObjectId | mongoose.Document>,
    document: mongoose.Types.ObjectId | mongoose.Document
): void {
    const containId = mongoArrayContainsId(array, document);

    if (containId) {
        const id: string = document._id.toString();
        throw new Error(`Expected array to not contain Document or ObjectId "${id}", but it does.`);
    }
}
