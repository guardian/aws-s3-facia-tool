export function configKey (options) {
    return [
        options.env,
        options.configKey
    ].join('/');
}

export function collectionsPrefix (options) {
    return [
        options.env,
        options.collectionsPrefix
    ].join('/');
}

export function collectionKey (id, options) {
    return [
        collectionsPrefix(options),
        id,
        'collection.json'
    ].join('/');
}

export function getHistoryConfigPrefix (date, options) {
    return [
        options.env,
        options.configHistoryPrefix,
        date,
        ''
    ].join('/');
}

export function getHistoryCollectionPrefix (collection, date, options) {
    return [
        options.env,
        options.collectionHistoryPrefix,
        date,
        collection,
        ''
    ].join('/');
}

export function getPressKey (front, location, options) {
    return [
        options.env,
        options.pressedPrefix,
        location === 'draft' ? 'draft' : 'live',
        front,
        'fapi/pressed.json'
    ].join('/');
}
