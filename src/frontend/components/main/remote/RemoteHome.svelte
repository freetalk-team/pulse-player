<script>

import { onMount } from "svelte";
import { fade } from "svelte/transition";

import { sleep } from "../../../utils/sleep";
import { scrollHover } from "../../../actions";

import { loadPosts, posts, currentRemote, hasMore, isLoading } from "../../../stores/remote";

import PostCard from "./PostCard.svelte";
import Recent from "./Recent.svelte";
import Donate from "./Donate.svelte";

import LoadSentinel from "../LoadSentinel.svelte";


</script>


<div class="flex-1 overflow-y-auto custom-scroll min-w-0"
    use:scrollHover
>
    <div class="mx-auto flex min-w-0 max-w-6xl gap-8 p-8">

        <div class="min-w-0 flex-1 flex flex-col gap-6">
            {#each $posts as post (post.id)}
                <PostCard {post} remote={true} />
            {/each}

            <LoadSentinel isLoading={$isLoading} hasMore={$hasMore} fetch={loadPosts} />
        </div>

        <!-- RIGHT SIDEBAR -->
        <div class="hidden w-80 shrink-0 xl:block">

            <div class="sticky top-8 space-y-6">
                <Recent />
                <Donate />
                <!-- <Users /> -->
                <!-- <Session /> -->
            </div>
        </div>
    </div>
</div>
