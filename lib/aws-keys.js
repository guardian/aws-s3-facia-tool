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
