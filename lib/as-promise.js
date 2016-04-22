export default function (action) {
	return new Promise(function (resolve, reject) {
		try {
			action((err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
		} catch (ex) {
			reject(ex);
		}
    });
}
