<script lang="ts">
    import { activePopup, selected } from "../../stores"
    import { customIcons } from "../main/customIcons"
    import icons from "./icons"

    export let id: string
    export let size: number = 1
    export let white: boolean = false
    export let right: boolean = false
    export let fill: boolean = false
    export let custom: boolean = false
    export let select: boolean = false
    export let selectData: any = null
    export let box: number = 24

    $: width = size + "rem"
    $: height = size + "rem"

    $: icon = custom ? customIcons[id] : icons[id]

    const click = () => {
        if (!select) return

        if (selectData && !$selected.data.includes(selectData.data[0])) selected.set(selectData)
        activePopup.set("icon")
    }
</script>

<svg class={$$props.class} class:white class:right class:fill class:select on:click={click} style="{$$props.style || ''};min-width: {width}" {width} {height} viewBox="0 0 {box} {box}">
    {@html icon ? icon : icons.noIcon}
</svg>

<style>
    svg {
        fill: var(--secondary);
    }

    svg.select {
        cursor: pointer;
    }

    svg.select:hover {
        background-color: var(--hover);
    }

    svg.white {
        /* fill: var(--text); */
        fill: currentColor;
    }

    svg.right {
        margin-right: 0.5em;
    }

    svg.fill {
        width: 100%;
        height: 100%;
    }
</style>
