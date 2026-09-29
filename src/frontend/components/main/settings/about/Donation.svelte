<script>

import pkg from '@pkg';
import bitcoinQr from '../../../../assets/bt-qr.png';

</script>

<section class="mb-10">
	<h2 class="text-xl font-semibold text-pulse-white mb-4 flex items-center gap-2">
		<i class="fa-solid fa-heart text-red-400"></i>
		Support & Donations
	</h2>

	<div class="space-y-3 leading-relaxed">
		<p>
			<strong>Pulse Player</strong> is developed as a <strong>free and open-source project</strong>.
			If you find it useful, consider supporting its continued development.
		</p>

		<p>Donations help us:</p>

		<ul class="space-y-1 text-gray-400">
			<li class="flex items-center gap-2">
			<i class="fa-solid fa-check text-green-400 text-xs"></i>
			Add new features and improvements
			</li>
			<li class="flex items-center gap-2">
			<i class="fa-solid fa-check text-green-400 text-xs"></i>
			Maintain infrastructure and tools
			</li>
			<li class="flex items-center gap-2">
			<i class="fa-solid fa-check text-green-400 text-xs"></i>
			Spend more time on open-source development
			</li>
		</ul>

		<p>
			Even small contributions make a big difference. If you can't donate, you can still support us
			by sharing the project or contributing feedback.
		</p>
		</div>

		<!-- Buttons -->
		<!-- <div class="flex flex-wrap gap-3 mt-5">
			<a  
				class="px-4 py-2 rounded-md bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-medium transition"
				target="_blank"
				rel="noopener noreferrer"
				href={pkg.donations.buymeacoffee}
			>
				<i class="fa-solid fa-mug-hot"></i>
				Buy Me a Coffee
			</a>
			<a class="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-sm transition"
				target="_blank"
				rel="noopener noreferrer"
				href={pkg.donations.github}
			>
				<i class="fa-brands fa-github"></i>
				GitHub Sponsors
			</a>
			<a class="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm transition"
				target="_blank"
				rel="noopener noreferrer"
				href={pkg.donations.stripe}
			>
				<i class="fa-solid fa-credit-card"></i>
				Stripe
			</a>
		</div> -->
</section>

<section class="border-t border-slate-900 bg-slate-900/20 py-20">
	<div class="max-w-5xl mx-auto px-6">
		<div class="max-w-2xl mx-auto text-center">
			<h2 class="text-2xl font-bold tracking-tight text-white">
				Support Pulse Player
			</h2>

			<p class="mt-4 text-slate-400 leading-relaxed">
				Pulse Player is free and open source. If you find it useful and
				would like to support its development, you can make a donation
				through one of the options below.
			</p>

			<p class="mt-3 text-slate-400 leading-relaxed">
				Your support helps with development, hosting, infrastructure,
				and future improvements to Pulse Player.
			</p>
		</div>

		<!-- Donation options -->
		<div class="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

			<a
				href={pkg.donations.buymeacoffee}
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center transition hover:border-slate-600 hover:bg-slate-800/60"
			>
				<div class="text-lg font-semibold text-white">
					Buy Me a Coffee
				</div>

				<p class="mt-2 text-sm text-slate-400">
					Make a small one-time contribution.
				</p>
			</a>

			<!-- <a
				href="YOUR_PAYPAL_URL"
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center transition hover:border-slate-600 hover:bg-slate-800/60"
			>
				<div class="text-lg font-semibold text-white">
					PayPal
				</div>

				<p class="mt-2 text-sm text-slate-400">
					Support Pulse Player through PayPal.
				</p>
			</a> -->

			<a
				href={pkg.donations.stripe}
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center transition hover:border-slate-600 hover:bg-slate-800/60"
			>
				<div class="text-lg font-semibold text-white">
					Card / Stripe
				</div>

				<p class="mt-2 text-sm text-slate-400">
					Make a contribution using a payment card.
				</p>
			</a>

			<a
				href={pkg.donations.github}
				target="_blank"
				rel="noopener noreferrer"
				class="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center transition hover:border-slate-600 hover:bg-slate-800/60"
			>
				<div class="text-lg font-semibold text-white">
					GitHub Sponsors
				</div>

				<p class="mt-2 text-sm text-slate-400">
					Support the open-source project through GitHub.
				</p>
			</a>

		</div>

		<!-- Bitcoin -->
		<div class="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
			<div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">

				<div>
					<h3 class="text-xl font-semibold text-white">
						Donate with Bitcoin
					</h3>

					<p class="mt-2 text-slate-400">
						If you prefer cryptocurrency, you can support Pulse Player
						directly with Bitcoin.
					</p>

					<div class="mt-5">
						<label class="block text-xs font-medium uppercase tracking-wider text-slate-500">
							Bitcoin address
						</label>

						<div class="mt-2 flex items-center gap-2">
							<code
								class="min-w-0 flex-1 overflow-hidden rounded-lg bg-black/30 px-3 py-2 text-sm text-slate-300 truncate"
							>
								{pkg.donations.bitcoin}
							</code>

							<button
								type="button"
								class="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
								onclick={() => navigator.clipboard.writeText(pkg.donations.bitcoin)}
							>
								Copy
							</button>
						</div>
					</div>
				</div>

				<div class="flex justify-center">
					<div class="rounded-xl bg-white p-3">
						<img
							src={bitcoinQr}
							alt="Bitcoin donation QR code"
							class="w-44 h-44"
						/>
					</div>
				</div>

			</div>
		</div>
	</div>
</section>
