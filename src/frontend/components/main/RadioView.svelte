
<script>

import { tooltip } from '../../actions';

import { currentStation, selectedStation, selectedView } from '../../stores/radio';
import { currentRadio } from '../../stores/play';

import Home from './radio/Home.svelte';
import StationView from './radio/Station.svelte';
import RecordingsView from './radio/RecordingsView.svelte';
import SlideView from './SlideView.svelte';

let showDetails = false;

function onDetails(item) {
    selectedStation.set(item);
    showDetails = true;
}

function onBack() {
    showDetails = false;
    selectedStation.set(null);
}

</script>

{#if $currentStation}
    <div class="flex h-full flex-col min-h-0">
        <StationView station={$currentStation} isPlaying={$currentStation.id == $currentRadio?.id} />
    </div>
{:else if $selectedView == 'stations'}
    <SlideView selected={showDetails}>

        <div slot="master" class="flex h-full flex-col min-h-0">
            <Home {onDetails} />
        </div>

        <div slot="detail" class="flex h-full flex-col min-h-0">
            <div class="px-8">
                <div class="flex items-center justify-between py-8 text-4xl border-b border-gray-500/30">
                    <div class="text-gray-500 flex items-center gap-4">
                        <i class="fa-solid fa-circle-info"></i>
                        <h1 class="truncate font-black text-bold uppercase tracking-wider">Details</h1>
                    </div>
                    <button class="icon-button" 
                        on:click={onBack}
                        use:tooltip={"Back"}
                    >
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                </div>
            </div>
            {#if $selectedStation}
                <StationView station={$selectedStation} isPlaying={$selectedStation?.id == $currentRadio?.id} />
            {/if}
        </div>

    </SlideView>
{:else if $selectedView == 'recordings'}
    <RecordingsView />
{/if}

<!-- {#if $currentStation}
    <StationView station={$currentStation} isPlaying={$currentStation.id == $currentRadio?.id} />
{:else}
    <Home />
{/if} -->