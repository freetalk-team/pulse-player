<script>
	import { isElectron } from "../../../../utils/env"

</script>
<section class="mb-10">
	<h2 class="text-xl font-semibold text-pulse-white mb-4 flex items-center gap-2">
		<i class="fa-solid fa-bolt-lightning text-pulse-accent"></i>
		Pulse Player
	</h2>

	<div class="space-y-3 leading-relaxed">
		<p>
			<strong class="text-pulse-white">Pulse Player</strong> is a modern, lightweight media player designed
			for simplicity, speed, and control. It supports both <strong>audio and video playback</strong>,
			allowing you to manage your entire media library in one place.
		</p>

		<p>
			You can easily <strong>import local files</strong>, and <strong>Pulse Player</strong> will automatically scan and
			extract metadata such as artist, album, track number, and cover art. Using this information,
			it intelligently <strong>organizes your content into albums and collections</strong> without
			requiring manual setup.
		</p>

		<p>
			The player is built with a focus on performance and usability, providing a smooth and
			distraction-free experience even with large libraries.
		</p>

		<ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-gray-400">
			<li class="flex items-center gap-2">
				<i class="fa-solid fa-bolt text-blue-400 text-xs"></i>
				Fast and responsive playback
			</li>
			<li class="flex items-center gap-2">
				<i class="fa-solid fa-layer-group text-blue-400 text-xs"></i>
				Automatic media organization
			</li>
			<li class="flex items-center gap-2">
				<i class="fa-solid fa-paintbrush text-blue-400 text-xs"></i>
				Clean and intuitive UI
			</li>
			<li class="flex items-center gap-2">
				<i class="fa-solid fa-file-audio text-blue-400 text-xs"></i>
				Wide format support
			</li>
		</ul>
	</div>

	<!-- GitHub -->
	<div class="pt-4">
		{#if isElectron}
			<a href="#" 
				on:click|preventDefault={() => api.openExternal('https://github.com/freetalk-team/player')} 
				class="link">
				<i class="fa-brands fa-github"></i>
				View source code on GitHub
			</a>
		{:else}
			<a href="https://github.com/freetalk-team/player" target="_blank" class="link">
				<i class="fa-brands fa-github"></i>
				View source code on GitHub
			</a>
		{/if}
	</div>
</section>