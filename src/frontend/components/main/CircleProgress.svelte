<script>

export let progress = 0; // 0 to 100

const radius = 40;
const strokeWidth = 6;
const circumference = 2 * Math.PI * radius;

// Dynamic offset based on progress percent
$: strokeDashoffset = circumference - (progress / 100) * circumference;

</script>

<div class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-[2px] rounded-xl z-30 transition-all duration-300">
	<div class="relative w-24 h-24 flex items-center justify-center">
		<!-- SVG Circle Track and Fill -->
		<svg class="w-full h-full transform -rotate-90">
			<!-- Background Track Circle -->
			<circle
				cx="50%"
				cy="50%"
				r={radius}
				fill="transparent"
				stroke="rgba(255, 255, 255, 0.1)"
				stroke-width={strokeWidth}
			/>
			<!-- Animated Progress Circle -->
			<circle
				cx="50%"
				cy="50%"
				r={radius}
				fill="transparent"
				stroke="var(--pulse-accent, #3b82f6)" 
				stroke-width={strokeWidth}
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
				stroke-linecap="round"
				class="transition-all duration-200 ease-out"
			/>
		</svg>
		
		<!-- Percent Number Text -->
		<div class="absolute text-white font-black text-sm tracking-tight">
			{Math.round(progress)}%
		</div>
	</div>
	<span class="text-[10px] uppercase font-bold tracking-widest text-white/50 mt-1">Downloading</span>
</div>
