import ffmpeg from 'ffmpeg-static';
import { execFile } from 'child_process';
import { join } from 'node:path';

export function generateThumb(videoPath, outputDir, thumbName) {

	if (!thumbName)
		thumbName = `thumb-${Date.now()}.jpg`;
	else
		thumbName += '.jpg';

    const outputPath = join(outputDir, thumbName);

	return new Promise((resolve, reject) => {
		// -ss 00:00:05 extracts a frame at 5 seconds (avoiding black intros)
		execFile(ffmpeg, [
			'-ss', '00:00:05', 
			'-i', videoPath, 
			'-vframes', '1', 
			'-q:v', '2', 
			outputPath
		], (err) => {
			if (err) reject(err);
			else resolve(outputPath); // Return the path to save in SQLite
		});
	});
}

/*

Album:
curl "https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s=Coldplay&a=Parachutes"

Track:
curl "https://www.theaudiodb.com/api/v1/json/123/searchalbum.php?s=Ceca&t=Prljavo"

curl --get 'https://musicbrainz.org/ws/2/release/' \
  --data-urlencode 'query=artist:"Coldplay" AND release:"Parachutes"' \
  --data-urlencode 'fmt=json' \
  --data-urlencode 'limit=1' \
  -H 'User-Agent: PulsePlayer/1.0 (team.freetalk@gmail.com)' | jq

curl "https://coverartarchive.org/release/c1b0fac7-e1db-485a-8367-5472b561f02b/front"




Spotify:
// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token = 'BQAmiJNpAiSpwTcUIaDVi_RrvSq0PrcDlrouxVjjFJQARYk8gN0yjQ6FKus_RuPmvje7njZDHExdC9ynDOCBCZqTlVz3SK9RLKJSombliGdxkaHV30YQlB02Z2x20VKFafcJDtq_KG35SzXoYHSl3ZzjMprjd8lx_Il9sZ6-uQf-0yKVpEvfGv8nsCVRunVn_vupUnSzdS6g0-4aeJ6h8eZRd7ne4QU3QdFXfNIuRByNWJ9Uho3qXJS00fWXdA4x2PIITaT46dyaS7SPZ0HHp2yMq60Goz2uFyJ4_KWPG-Lp7Nc55YOLuJ1CrMeD_3ewSZ29dQ';
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

const topTracks = await getTopTracks();
console.log(
  topTracks?.map(
    ({name, artists}) =>
      `${name} by ${artists.map(artist => artist.name).join(', ')}`
  )
);

*/