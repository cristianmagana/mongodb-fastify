import {Logger} from 'loglevel';
import {MongoClient} from 'mongodb';

export type Initializer = {
    dbClient: MongoClient;
    log: Logger;
};
