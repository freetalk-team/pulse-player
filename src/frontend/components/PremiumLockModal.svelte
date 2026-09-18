<script context="module">

import { writable } from 'svelte/store';

const lockedFeatureTarget = writable(null);

export function runPremiumAction(feature) {
    const features = api.getPref('features');

	console.debug('Checking features:', features, feature);

	if (!features.includes(feature)) {
        lockedFeatureTarget.set(feature);
        return false;
	}

    return true;
}

</script>

<script>

import { scale, fade } from 'svelte/transition';

import pkg from '@pkg';

// export let isOpen = false;
// export let featureId = 1; // 1 = Meta, 2 = Download, 3 = Radio
// export let onClose = () => {};

// Feature dictionary mapping to your specific pro modules
const premiumFeatures = {
    'TAG_METADATA': {
        title: "Advanced Metadata Toolkit",
        desc: "Writing tags directly to files and fetching online database track info requires a Pro license upgrade.",
        icon: "fa-tags"
    },
    'REMOTE_DOWNLOAD': {
        title: "Remote Offline Sync",
        desc: "Downloading remote albums and curated playlists over your local network is a Pro feature.",
        icon: "fa-cloud-arrow-down"
    },
    'STREAM_RECORD': {
        title: "Live Stream Recorder",
        desc: "Slicing and recording online radio stations in real-time is exclusive to Pro users.",
        icon: "fa-radio"
    }
};

$: activeFeature = premiumFeatures[$lockedFeatureTarget] || premiumFeatures[1];

function handleUpgradeClick() {
    if (api.openExternal) {
        api.openExternal(`${pkg.homepage}/features`);
    }

    lockedFeatureTarget.set(null);

    // onClose();
    
}

function handleClose() {
    lockedFeatureTarget.set(null);
}

</script>

{#if $lockedFeatureTarget}
    <!-- Dark Backdrop Overlay -->
    <div 
        transition:fade={{ duration: 150 }} 
        class="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4"
        on:click|self={onClose}
    >
        <!-- Modal Card Container -->
        <div 
            transition:scale={{ duration: 200, start: 0.95 }}
            class="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col items-center text-center space-y-5"
        >
            <!-- Glowing Crown + Feature Icon Layout -->
            <div class="relative flex items-center justify-center w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <i class="fa-solid {activeFeature.icon} text-2xl text-amber-400"></i>
                <div class="absolute -top-1.5 -right-1.5 bg-amber-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase shadow-md flex items-center gap-0.5">
                    <i class="fa-solid fa-crown text-[8px]"></i> Pro
                </div>
            </div>

            <!-- Dynamic Typography Content -->
            <div class="space-y-1.5">
                <h3 class="text-lg font-black tracking-tight text-white">{activeFeature.title}</h3>
                <p class="text-xs text-zinc-400 leading-relaxed px-2">
                    {activeFeature.desc}
                </p>
            </div>

            <!-- Action Buttons Stack -->
            <div class="w-full space-y-2 pt-2">
                <button 
                    on:click={handleUpgradeClick}
                    class="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/5 flex items-center justify-center gap-1.5"
                >
                    Upgrade on Website <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                </button>
                
                <button 
                    on:click={handleClose}
                    class="w-full py-2 text-zinc-400 hover:text-zinc-200 text-xs font-semibold transition"
                >
                    Maybe Later
                </button>
            </div>
        </div>
    </div>
{/if}
