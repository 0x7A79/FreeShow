<script lang="ts">
    import { MAIN } from "../../../../types/Channels"
    import { outLocked, outputs } from "../../../stores"
    import { receive, send } from "../../../utils/request"
    import { getActiveOutputs, setOutput } from "../../helpers/output"
    import Capture from "./Capture.svelte"

    let screens: any[] = []
    export let streams: any[]
    send(MAIN, ["GET_SCREENS"])
    receive(MAIN, { GET_SCREENS: (d: any) => (screens = d) })

    $: currentOutput = $outputs[getActiveOutputs()[0]]

    // NDI

    // TODO: NDI inputs
    // const receiveNDI: any = {
    //     RECEIVE_LIST: (msg) => {
    //         console.log(msg)
    //         send(NDI, ["RECEIVE_STREAM"], { source: msg[0] })
    //     },
    //     RECEIVE_STREAM: (stream) => {
    //         console.log(stream)
    //     },
    // }

    // send(NDI, ["RECEIVE_LIST"])
    // receive(NDI, receiveNDI)
</script>

{#each screens as screen}
    <Capture
        bind:streams
        {screen}
        on:click={(e) => {
            if ($outLocked || e.ctrlKey || e.metaKey) return
            if (currentOutput.out?.background?.id === screen.id) setOutput("background", null)
            else setOutput("background", { id: screen.id, type: "screen" })
        }}
    />
{/each}
