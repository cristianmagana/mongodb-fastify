import {LogLevelDesc, Logger, getLogger as getLogLogLevel, levels} from 'loglevel';

export const getLogger = (name: string): Logger => {
    const log = getLogLogLevel(`starting ${name}`);
    const level = (process.env.LOG_LEVEL as LogLevelDesc) || levels.DEBUG;
    log.setLevel(level);
    return log;
};
