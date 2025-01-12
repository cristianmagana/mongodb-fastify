import {getInitializer} from './config/initializer';

export const app = async () => {
    const initializer = await getInitializer('mongodb-api');
    const {dbClient, log} = initializer;
    log.debug('MongoDB client created:', dbClient);
    log.info('Initializer complete.');

    addEventListener("fetch", (event) => {
        const url = new URL(event.request.url);

        if (url.pathname === '/health') {
            event.respondWith(new Response('OK', {status: 200}));
        } else {
            event.respondWith(new Response('Not Found', {status: 404}));
        }
