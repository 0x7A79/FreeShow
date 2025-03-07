<script lang="ts">
    import { uid } from "uid"
    import { activeShow, cachedShowsData, dictionary, fullColors, globalGroupViewEnabled, groups, labelsDisabled, selected } from "../../../stores"
    import { ondrop } from "../../helpers/drop"
    import { history } from "../../helpers/history"
    import T from "../../helpers/T.svelte"
    import Center from "../../system/Center.svelte"
    import SelectElem from "../../system/SelectElem.svelte"
    import Button from "../../inputs/Button.svelte"
    import Icon from "../../helpers/Icon.svelte"

    $: showGroups = $cachedShowsData[$activeShow!.id]?.groups || []

    $: globalGroups = Object.entries($groups).map(([id, group]: any) => {
        let name = group.name
        if (group.default) name = $dictionary.groups?.[group.name]
        return { id, group: name, color: group.color || null, globalGroup: id, settings: {}, notes: "", items: [] }
    })

    $: sortedGroups = globalGroups.sort((a: any, b: any) => a.group?.localeCompare(b.group))
</script>

<div style="display: flex;padding: 10px;height: 100%;overflow-y: auto;">
    <div class="main">
        {#if $globalGroupViewEnabled}
            <h4><T id="groups.current" /></h4>
        {/if}
        {#if showGroups.length}
            {#each showGroups as slide}
                <SelectElem id="group" data={{ id: slide.id }} draggable>
                    <!-- style="{$fullColors ? 'background-' : ''}color: {slide.color};{$fullColors && slide.color ? `color: ${getContrast(slide.color)};` : ''}" -->
                    <div
                        class="slide context #group"
                        style="border-bottom: 2px solid {slide.color};{$fullColors ? '' : `color: ${slide.color};`}"
                        on:click={(e) => {
                            if (!e.ctrlKey && !e.metaKey) {
                                selected.set({ id: "group", data: [{ id: slide.id }] })
                                ondrop(null, "slide")
                                selected.set({ id: null, data: [] })
                            }
                        }}
                    >
                        <p>{slide.group || "—"}</p>
                    </div>
                </SelectElem>
            {/each}
        {:else}
            <Center faded>
                <T id="empty.slides" />
            </Center>
        {/if}
    </div>

    {#if $globalGroupViewEnabled}
        <div class="seperator" />

        <div class="main">
            <h4><T id="groups.global" /></h4>
            {#if sortedGroups.length}
                {#each sortedGroups as slide}
                    <SelectElem id="global_group" data={slide} draggable>
                        <!-- style="{$fullColors ? 'background-' : ''}color: {slide.color};{$fullColors && slide.color ? `color: ${getContrast(slide.color)};` : ''}" -->
                        <div
                            class="slide context #global_group"
                            style="border-bottom: 2px solid {slide.color};{$fullColors ? '' : `color: ${slide.color};`}"
                            on:click={(e) => {
                                if (!e.ctrlKey && !e.metaKey && $activeShow) {
                                    // , unique: true
                                    history({ id: "SLIDES", newData: { data: [{ ...slide, id: uid() }] } })
                                }
                            }}
                        >
                            <p>
                                {slide.group || "—"}
                                {#if $groups[slide.id]?.shortcut}<span class="shortcut">{$groups[slide.id].shortcut}</span>{/if}
                            </p>
                        </div>
                    </SelectElem>
                {/each}
            {:else}
                <Center faded>
                    <T id="empty.slides" />
                </Center>
            {/if}
        </div>
    {/if}
</div>

<div class="bottom">
    <Button style="width: 100%;" on:click={() => globalGroupViewEnabled.set(!$globalGroupViewEnabled)} dark center>
        <Icon id="groups" right={!$labelsDisabled} white={$globalGroupViewEnabled} />
        {#if !$labelsDisabled}<T id="groups.toggle_global_group" />{/if}
    </Button>
</div>

<style>
    .main {
        display: flex;
        flex-direction: column;

        /* two columns */
        /* justify-content: space-between;
        flex-wrap: wrap;
        align-content: flex-start; */

        gap: 3px;
        flex: 1;
        overflow-x: clip;
    }

    /* two columns */
    /* .main :global(.selectElem) {
        width: 47%;
    } */

    .slide {
        /* padding: 5px; */
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8em;
        font-weight: bold;
        background-color: var(--primary-darker);
        cursor: pointer;
        padding: 0 5px;
    }
    .slide:hover {
        filter: brightness(1.1);
    }

    .shortcut {
        position: absolute;
        right: 5px;
        background-color: var(--primary-darker);

        color: rgb(255 255 255 / 0.5);
        /* opacity: 0.6; */
        font-style: italic;
        font-size: 0.9em;
        padding-left: 5px;
    }

    h4 {
        overflow: visible;
        text-align: center;
        color: var(--text);
    }

    .seperator {
        width: 1px;
        height: 100%;
        margin: 0 10px;
        background-color: var(--primary-lighter);
    }
</style>
