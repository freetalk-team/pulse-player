import { execFile } from 'child_process';
import ffprobe from 'ffprobe-static'; // Highly recommended to bundle this

function getVideoMetadata(filePath) {
	return new Promise((resolve) => {
		execFile(ffprobe.path, [
			'-v', 'error',
			'-select_streams', 'v:0', // Only look at the first video stream
			//'-show_entries', 'format=duration',
			'-show_entries', 'stream=width,height,codec_name,r_frame_rate:format=duration',
			//'-of', 'default=noprint_wrappers=1:nokey=1',
			'-of', 'json', 
			filePath
		], (err, stdout) => {
			if (err) return resolve({ duration: 0, quality: null, fps: null });
			
			const data = JSON.parse(stdout);
			const stream = data.streams[0];
			const duration = parseFloat(data.format.duration);
			
			// Calculate Quality Label
			let quality = 'SD';
			if (stream.width >= 3840) quality = '4K';
			else if (stream.width >= 1920) quality = 'HD';
			else if (stream.width >= 1280) quality = '720p';

			// Calculate FPS (ffprobe returns "60/1" or "30000/1001")
			const fpsParts = stream.r_frame_rate.split('/');
			const fps = Math.round(fpsParts[0] / fpsParts[1]);

			resolve({
				duration: isNaN(duration) ? 0 : duration,
				quality,
				fps: fps > 30 ? `${fps}` : null // Only show if > 30fps (e.g. 60)
			});
		});
	});
}
