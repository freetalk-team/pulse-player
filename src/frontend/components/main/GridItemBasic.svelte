<script>

import { searchQuery } from '../../stores/selection';
import { highlightMatch } from '../../utils/text';

export let track;

</script>

<div class="group bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer">
	<div class="aspect-square bg-black/20 rounded-lg mb-3 flex items-center justify-center shadow-xl">
	<i class="fa-solid {track.type === 'video' ? 'fa-video' : 'fa-music'} text-gray-700 text-3xl"></i>
	</div>
	<p class="text-sm font-bold truncate">{@html highlightMatch(track.title, $searchQuery)}</p>
	<p class="text-[10px] text-gray-500 uppercase">{track.artist}</p>
</div>