<script lang="ts">
    import { MAIN } from "../../../../types/Channels"
    import { activePopup, alertMessage } from "../../../stores"
    import { send } from "../../../utils/request"
    import Icon from "../../helpers/Icon.svelte"
    import T from "../../helpers/T.svelte"
    import Button from "../../inputs/Button.svelte"

    let msg: string = ""
    $: msg = $alertMessage.toString()

    // UPDATER
    $: console.log(msg)
    $: if (msg.includes("freeshow.app")) {
        msg = msg.replace("freeshow.app", '<a href="#void" class="website">freeshow.app</a>')
    }

    function click(e: any) {
        if (e.target.closest(".website")) {
            send(MAIN, ["URL"], "https://freeshow.app/?download")
        }
    }
</script>

<p on:click={click}>
    {#key msg}
        {#if !msg.includes("<") && msg?.length - msg?.replaceAll(".", "").length === 1}
            <T id={msg} />
        {:else}
            {@html msg}
        {/if}
    {/key}
</p>

<br />

<Button on:click={() => activePopup.set(null)} center dark>
    <Icon id="check" size={1.2} />
</Button>

<style>
    p {
        white-space: initial;
    }

    p :global(a) {
        color: var(--text);
        opacity: 0.7;

        display: inline-flex;
        gap: 5px;
        align-items: flex-end;

        -webkit-user-drag: none;
    }
    p :global(a):hover {
        opacity: 0.75;
    }
    p :global(a):active {
        opacity: 0.9;
    }
</style>
