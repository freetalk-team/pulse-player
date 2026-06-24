
const url = config.baseUrl + `/${config.apiKey}/searchalbum.php`
const params = { s: album.artist, a: album.name }

const res = await http.get(url, params)

const meta = res?.album?.[0]
  
if (meta) {
	album.setThumbnail(meta.strAlbumThumb)
	album.setYear(meta.intYearReleased)
	album.setGenre(meta.strGenre)
	album.setDescription(meta.strDescription)

	return true
}
