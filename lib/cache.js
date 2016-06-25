import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';

export default function () {
    let basePath = path.join(__dirname, '/../tmp/');
    let cacheEnabled = false;

    function setEnabled (value) {
        cacheEnabled = !!value;
    }
    function setBasePath (value) {
        basePath = value;
    }
    function key (key) {
        var filename = path.join(basePath, key.replace(/[\/:@]/g, '_'));

        return {
            get: function () {
                if (cacheEnabled) {
                    if (fs.existsSync(filename)) {
                        var content = fs.readFileSync(filename);

                        return JSON.parse(content.toString());
                    }
                }
            },
            store: function (text) {
                if (cacheEnabled) {
                    mkdirp.sync(path.dirname(filename));
                    fs.writeFileSync(filename, text);
                }
            }
        };
    }

    return {setEnabled, setBasePath, key};
}
