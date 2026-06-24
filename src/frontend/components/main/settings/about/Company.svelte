<script>
	import { isElectron } from "../../../../utils/env"

</script>
<section class="mb-10">
	<h2 class="text-xl font-semibold text-pulse-white mb-4 flex items-center gap-2">
		<i class="fa-solid fa-building text-purple-400"></i>
		Freetalk Team
	</h2>

	<div class="space-y-3 leading-relaxed">
		<p>
			<strong class="text-pulse-white">Freetalk Team</strong> is a small independent IT company focused on
			building <strong>free and open-source software</strong>. Our goal is to create tools that are
			accessible, transparent, and easy to use.
		</p>

		<p>
			Alongside our own products, we provide <strong>software development and outsourcing services</strong>,
			helping clients build reliable and scalable applications.
		</p>

		<p>
			We value simplicity, clean architecture, and user-focused design, aiming to deliver software
			that feels fast, intuitive, and dependable.
		</p>
	</div>

	<!-- Team -->
	<div class="mt-5">
		<h3 class="text-sm font-medium text-gray-400 mb-3">Team Members</h3>
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
			<div class="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-md">
			<i class="fa-solid fa-user text-gray-400 text-xs"></i>
			<strong>Pavel Patarinski</strong> - <i>Software Engineer</i>
			</div>
			<div class="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-md">
			<i class="fa-solid fa-user text-gray-400 text-xs"></i>
			<strong>Srebrina Zlateva</strong> - <i>Project Manager</i>
			</div>
			<div class="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-md">
			<i class="fa-solid fa-user text-gray-400 text-xs"></i>
			<strong>Preslav Petrov</strong> - <i>QA</i>
			</div>
			<div class="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-md">
			<i class="fa-solid fa-dog text-gray-400 text-xs"></i>
			<strong>Raya</strong> - <i>The dog</i>
			</div>
		</div>
	</div>

	<!-- Contacts -->
	<div class="mt-5">
		<h3 class="text-sm font-medium text-gray-400 mb-3">Contact</h3>
		<div class="space-y-2 text-sm">
			<div class="flex items-center gap-2">
			<i class="fa-solid fa-envelope text-gray-400 text-xs"></i>
			<a href="mailto:contact@freetalk.dev" class="hover:text-pulse-white transition">
				team.freetalk@gmail.com
			</a>
			</div>
			<div class="flex items-center gap-2">
			<i class="fa-solid fa-envelope text-gray-400 text-xs"></i>
			<a href="mailto:support@freetalk.dev" class="hover:text-pulse-white transition">
				pavelp.work@gmail.com
			</a>
			</div>
			<div class="flex items-center gap-2">
			<i class="fa-solid fa-envelope text-gray-400 text-xs"></i>
			<a href="mailto:support@freetalk.dev" class="hover:text-pulse-white transition">
				srebrina.zlateva@gmail.com
			</a>
			</div>
		</div>
	</div>

	<!-- Website -->
	<div class="mt-5">
		<h3 class="text-sm font-medium text-gray-400 mb-3">Website</h3>
		<div class="space-y-2 text-sm">
			<div class="flex items-center gap-2">
			<i class="fa-solid fa-earth-americas text-gray-400 text-xs"></i>
			{#if isElectron}
				<a href="#" 
					on:click|preventDefault={() => api.openExternal('https://www.sipme.io')} 
					class="link"
				>
					www.sipme.io
				</a>
			{:else}
				<a href="https://www.sipme.io" target="_blank" class="link">
					www.sipme.io
				</a>
			{/if}
			</div>
		</div>
	</div>
</section>