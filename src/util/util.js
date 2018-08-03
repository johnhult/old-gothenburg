export function capitalizeFirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getEmptyMarkerInfo() {
	let markerInfo = {
		audioPath: '',
		header: '',
		text: ''
	};
	return markerInfo;
}
