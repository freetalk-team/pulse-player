import ffmpeg from 'ffmpeg-static'
import { spawn } from 'child_process'

const proc = spawn(ffmpeg, [
  '-re',
  '-i', trackPath,

  '-f', 'mp3',
  '-b:a', '192k',

  'pipe:1'
])

proc.stdout.on('data', chunk => {
  clients.forEach(res => res.write(chunk))
})