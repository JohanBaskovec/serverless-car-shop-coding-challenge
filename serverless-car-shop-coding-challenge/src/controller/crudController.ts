import {
    type APIGatewayProxyEventPathParameters,
    type APIGatewayProxyEventQueryStringParameters,
    type APIGatewayProxyResult
} from 'aws-lambda/trigger/api-gateway-proxy.js';
import mongoose, { mongo } from 'mongoose';
import {
    ConstraintError,
    EntityDoesNotExistError,
    MissingKeyInJSONBodyError,
    MissingPathParametersError,
    MissingRequestBody
} from '../error/errors.js';
import { type CrudService } from '../service/crudService.js';

export class CrudController<Document extends mongoose.Document, CreateDTO, UpdateDTO> {
    constructor(private readonly crudService: CrudService<Document, CreateDTO, UpdateDTO>) {
    }

    async getAll(queryStringParameters: APIGatewayProxyEventQueryStringParameters | null = null): Promise<APIGatewayProxyResult> {
        try {
            const entities = await this.crudService.getAll(queryStringParameters);
            return this.successResponse(entities);
        } catch (e) {
            return this.errorResponse(e);
        }
    }

    private parseBody(body: string | null): any {
        if (body == null) {
            throw new MissingRequestBody();
        }
        return JSON.parse(body);
    }

    private getPathParameter(pathParameters: APIGatewayProxyEventPathParameters | null, name: string): string {
        if (pathParameters == null) {
            throw new MissingPathParametersError([name]);
        }
        const param = pathParameters[name];
        if (param == null) {
            throw new MissingPathParametersError([name]);
        }
        return param;
    }

    async create(requestBody: string | null): Promise<APIGatewayProxyResult> {
        try {
            const dto: CreateDTO = this.parseBody(requestBody);
            const entity = await this.crudService.create(dto);
            return this.successResponse(entity);
        } catch (e) {
            return this.errorResponse(e);
        }
    }

    async update(requestBody: string | null): Promise<APIGatewayProxyResult> {
        try {
            const dto: UpdateDTO = this.parseBody(requestBody);
            const entity: Document = await this.crudService.update(dto);
            return this.successResponse(entity);
        } catch (e) {
            return this.errorResponse(e);
        }
    }

    async remove(pathParameters: APIGatewayProxyEventPathParameters | null): Promise<APIGatewayProxyResult> {
        try {
            const id = this.getPathParameter(pathParameters, 'id');
            const deletionResponse = await this.crudService.remove(id);
            return this.successResponse(deletionResponse);
        } catch (e) {
            return this.errorResponse(e);
        }
    }

    successResponse(data: any): APIGatewayProxyResult {
        return {
            statusCode: 200,
            body: JSON.stringify(
                {
                    data
                }
            )
        };
    }

    errorResponse(error: Error | mongoose.MongooseError): APIGatewayProxyResult {
        let type: string;
        let code: number;
        let message: string;
        if (error instanceof MissingKeyInJSONBodyError ||
            error instanceof mongoose.Error.CastError ||
            error instanceof mongoose.Error.ValidationError ||
            error instanceof mongo.BSON.BSONError ||
            error instanceof MissingPathParametersError ||
            error instanceof ConstraintError ||
            error instanceof MissingRequestBody ||
            error instanceof SyntaxError // thrown by JSON.parse
        ) {
            type = error.name;
            // In Node.js, mongoose.Error has a message property, so we can safely use it, but Typescript doesn't know it
            message = (error as Error).message;
            code = 400;
        } else if (
            error instanceof EntityDoesNotExistError ||
            error instanceof mongoose.Error.DocumentNotFoundError
        ) {
            type = error.name;
            message = (error as Error).message;
            code = 404;
        } else {
            type = 'UnexpectedError';
            message = 'An unexpected error happened.';
            code = 500;
        }

        return {
            statusCode: code,
            body: JSON.stringify(
                {
                    error: {
                        type,
                        message
                    }
                }
            )
        };
    }
}
