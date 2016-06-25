import { formatDate } from '../lib/since';

export default function () {
	function create (list) {
		function at (date, defaultValue) {
			const target = new Date(date);
			const targetDate = formatDate(target);
			const targetISO = target.toISOString();

			const sorted = list
				.filter(point => point.object <= targetDate)
				.sort((a ,b) => a.object < b.object);
			if (sorted.length > 0) {
				const versions = sorted[0].json.filter(point => point.lastModified <= targetISO);
				return versions[versions.length - 1] || defaultValue;
			} else {
				return defaultValue;
			}
		}

		return {at};
	}

	return {create};
}
