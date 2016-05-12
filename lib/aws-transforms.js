export function toListOfConfigChanges (list = []) {
    return list.map(listObjectToChange);
}

export function toListOfCollectionChanges (list = []) {
    return list.map(listObjectToChange);
}

function listObjectToChange (data) {
    return {
        key: data.Key,
        lastModified: data.LastModified,
        etag: data.ETag
    };
}
