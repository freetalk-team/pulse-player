<script>

import { fade } from 'svelte/transition';

import Product from './about/Product.svelte';
import Company from './about/Company.svelte';
import Donation from './about/Donation.svelte';
// import Marina from './about/Marina.svelte';

</script>

<div class="flex flex-col p-6 gap-4" in:fade>
	<h1 class="text-pulse-white/80 bg-pulse-white/5 font-black tracking-wider rounded-xl p-4 text-3xl">
		<i class="fa-solid fa-circle-info mr-4"></i>
		About
	</h1>
	<div class="max-w-4xl mx-auto px-6 py-8 text-gray-300">
		<Product />
		<Company />
		<Donation />
		<!-- <Marina /> -->
	</div>
</div>