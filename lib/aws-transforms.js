export function toListOfConfigChanges (list = []) {
    return list.map(data => {
        return {
            key: data.Key,
            lastModified: data.LastModified,
            etag: data.ETag
        };
    });
}
