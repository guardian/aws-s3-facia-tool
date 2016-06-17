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

export function toListOfVersions (list = []) {
    return list.map(data => {
        return {
            lastModified: data.LastModified,
            etag: data.ETag,
            isLatest: data.IsLatest,
            id: data.VersionId
        };
    });
}
