<div class="rounded-3xl border border-white/5 bg-white/[0.03] p-5 backdrop-blur-xl">

	<h3 class="mb-4 text-lg font-semibold">
		Online Users
	</h3>

	<div class="space-y-4">

		{#each ['Pat', 'Anna', 'Alex', 'Maria'] as user}

			<div class="flex items-center gap-3">

				<div class="relative">

					<div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 font-medium">
						{user[0]}
					</div>

					<div class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#0b0f17] bg-emerald-400"></div>
				</div>

				<div>
					<div class="font-medium">
						{user}
					</div>

					<div class="text-sm text-zinc-500">
						Listening now
					</div>
				</div>
			</div>

		{/each}
	</div>
</div>