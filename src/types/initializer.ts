import {Logger} from 'loglevel';
import {MongoClient} from 'mongodb';
import {FastifyInstance} from 'fastify';

export type Initializer = {
    dbClient: MongoClient;
    log: Logger;
    fastify: FastifyInstance;
};
