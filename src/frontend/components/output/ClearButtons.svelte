<script lang="ts">
    import { dictionary, labelsDisabled, outLocked, outputCache, outputs, playingAudio, presenterControllerKeys } from "../../stores"
    import { clearAudio } from "../helpers/audio"
    import Icon from "../helpers/Icon.svelte"
    import { clearPlayingVideo, isOutCleared, setOutput } from "../helpers/output"
    import { clearAll, clearOverlays } from "../helpers/showActions"
    import T from "../helpers/T.svelte"
    import Button from "../inputs/Button.svelte"
    import { clearTimers } from "./clear"

    export let autoChange: any
    export let activeClear: any
    export let outputId: string

    $: allCleared = isOutCleared(null, $outputs) && !Object.keys($playingAudio).length
    $: if (allCleared) autoChange = true

    function restoreOutput() {
        outputs.set($outputCache)
        outputCache.set(null)
    }

    let enableRestore: boolean = false
    $: if ($outputCache) setTimeout(() => (enableRestore = true), 1000)
    $: if (!allCleared) {
        enableRestore = false
        outputCache.set(null)
    }

    // ACTIONS

    const clearActions: any = {
        background: () => {
            clearPlayingVideo(outputId)
        },
        slide: () => {
            setOutput("slide", null)
        },
        overlays: () => {
            clearOverlays()
        },
        audio: () => {
            clearAudio()
        },
        nextTimer: () => {
            clearTimers()
        },
    }

    function clear(key: string) {
        if ($outLocked || !clearActions[key]) return
        autoChange = true

        clearActions[key]()
    }

    function openPreview(key: string) {
        if (activeClear === key) {
            autoChange = true
            activeClear = null
            return
        }

        autoChange = false
        activeClear = key
    }
</script>

<div class="clear" style="border-top: 2px solid var(--primary-lighter);">
    <span>
        {#if allCleared && $outputCache}
            <Button class="clearAll" disabled={$outLocked || !enableRestore} on:click={restoreOutput} dark center>
                <Icon id="reset" size={1.2} right={!$labelsDisabled} />
                {#if !$labelsDisabled}<T id={"preview.restore_output"} />{/if}
            </Button>
        {:else}
            <Button class="clearAll" disabled={$outLocked || allCleared} on:click={() => clearAll(true)} title="{$dictionary.clear?.all} [esc]" red dark center>
                <Icon id="clear" size={1.2} right={!$labelsDisabled} />
                {#if !$labelsDisabled}<T id={"clear.all"} />{/if}
            </Button>
        {/if}
    </span>
    <span class="group">
        <div class="combinedButton">
            <Button disabled={$outLocked || isOutCleared("background", $outputs)} on:click={() => clear("background")} title={$dictionary.clear?.background + " [F1]"} dark red center>
                <Icon id="background" size={1.2} />
            </Button>
            {#if !allCleared}
                <Button on:click={() => openPreview("background")} title={$dictionary.preview?.background} dark={activeClear !== "background"} />
            {/if}
        </div>

        <div class="combinedButton">
            <Button disabled={$outLocked || isOutCleared("slide", $outputs)} on:click={() => clear("slide")} title={$dictionary.clear?.slide + " [F2]"} dark red center>
                <Icon id="slide" size={1.2} />
            </Button>
            {#if !allCleared}
                <Button on:click={() => openPreview("slide")} title={$dictionary.preview?.slide} dark={activeClear !== "slide"} />
            {/if}
        </div>

        <div class="combinedButton">
            <Button disabled={$outLocked || isOutCleared("overlays", $outputs, true)} on:click={() => clear("overlays")} title={$dictionary.clear?.overlays + " [F3]"} dark red center>
                <Icon id="overlays" size={1.2} />
            </Button>
            {#if !allCleared}
                <Button on:click={() => openPreview("overlays")} title={$dictionary.preview?.overlays} dark={activeClear !== "overlays"} />
            {/if}
        </div>

        <div class="combinedButton">
            <Button disabled={$outLocked || !Object.keys($playingAudio).length} on:click={() => clear("audio")} title={$dictionary.clear?.audio + " [F4]"} dark red center>
                <Icon id="audio" size={1.2} />
            </Button>
            {#if !allCleared}
                <Button on:click={() => openPreview("audio")} title={$dictionary.preview?.audio} dark={activeClear !== "audio"} />
            {/if}
        </div>

        <div class="combinedButton">
            <Button disabled={$outLocked || isOutCleared("transition", $outputs)} on:click={() => clear("nextTimer")} title={$dictionary.clear?.nextTimer + ($presenterControllerKeys ? "" : " [F5]")} dark red center>
                <Icon id="clock" size={1.2} />
            </Button>
            {#if !allCleared}
                <Button on:click={() => openPreview("nextTimer")} title={$dictionary.preview?.nextTimer} dark={activeClear !== "nextTimer"} />
            {/if}
        </div>
    </span>
</div>

<style>
    .clear {
        display: flex;
        flex-direction: column;
    }

    :global(.clearAll) {
        width: 100%;
    }

    .group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
    }
    .group :global(button) {
        flex-grow: 1;
        /* height: 40px; */
    }

    .combinedButton {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
    }
    .combinedButton :global(button:last-child) {
        padding: 5px !important;
    }
</style>
