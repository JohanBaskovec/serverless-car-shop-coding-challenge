import { type APIGatewayProxyEventQueryStringParameters } from 'aws-lambda/trigger/api-gateway-proxy.js';

export interface CrudService<MongoDocument, CreateDTO, UpdateDTO> {
    getAll: (queryStringParameters: APIGatewayProxyEventQueryStringParameters | null) => Promise<MongoDocument[]>

    create: (dto: CreateDTO) => Promise<MongoDocument>

    update: (dto: UpdateDTO) => Promise<MongoDocument>

    remove: (id: string) => any
}
