<script>

import { formatTime } from "../../utils/format";

export let duration = 0;

</script>

<span class="flex items-center px-1.5 py-0.5 
	bg-black/40 backdrop-blur-md border border-white/10 rounded-full 
	text-[9px] font-black text-white/80 whitespace-nowrap">
	{formatTime(duration)}
</span>