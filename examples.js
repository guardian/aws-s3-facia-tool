const tool = require('./dist/bundle');

const client = new tool.Client({
    'bucket': 'facia-tool-store',
    'env': 'CODE',
    'configKey': 'frontsapi/config/config.json',
    'configHistoryPrefix': 'frontsapi/history/config',
    'collectionHistoryPrefix': 'frontsapi/history/collection',
    'collectionsPrefix': 'frontsapi/collection',
    'pressedPrefix': 'frontsapi/pressed',
    'maxParallelRequests': 6,
    'maxDaysHistory': 7
});

tool.Config(client).fetch().then(config => {
    console.log(config);
}).catch(console.error);
