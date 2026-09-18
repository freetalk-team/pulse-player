
const apiUrl = import.meta.env.VITE_API_URL || '';

const platform = {

	resolve(path) { 
		return apiUrl + path 
	}

	, remote: true
}

window.platform = platform;