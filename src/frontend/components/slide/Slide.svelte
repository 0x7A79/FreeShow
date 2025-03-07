<script lang="ts">
    import { onMount } from "svelte"
    import { MAIN } from "../../../types/Channels"
    import type { MediaStyle } from "../../../types/Main"
    import type { Media, Show, Slide, SlideData } from "../../../types/Show"
    import { activeShow, activeTimers, checkedFiles, dictionary, driveData, fullColors, groupNumbers, groups, media, mediaFolders, outputs, overlays, refreshListBoxes, showsCache, slidesOptions, styles } from "../../stores"
    import { send } from "../../utils/request"
    import MediaLoader from "../drawer/media/MediaLoader.svelte"
    import Editbox from "../edit/Editbox.svelte"
    import { getItemText } from "../edit/scripts/textStyle"
    import { clone, keysToID } from "../helpers/array"
    import { getContrast } from "../helpers/color"
    import { GetLayoutRef } from "../helpers/get"
    import { checkMedia, getFileName, getMediaStyle, splitPath } from "../helpers/media"
    import { getActiveOutputs, getResolution } from "../helpers/output"
    import SelectElem from "../system/SelectElem.svelte"
    import Actions from "./Actions.svelte"
    import Icons from "./Icons.svelte"
    import Textbox from "./Textbox.svelte"
    import Zoomed from "./Zoomed.svelte"

    export let slide: Slide
    export let layoutSlide: SlideData
    export let layoutSlides: any[] = []
    export let show: Show
    export let color: string | null = slide.color
    export let index: number
    export let columns: number = 1
    export let output: any = null
    export let active: boolean = false
    export let focused: boolean = false
    export let list: boolean = false
    export let endIndex: null | number = null
    export let icons: boolean = false
    export let noQuickEdit: boolean = false
    export let altKeyPressed: boolean = false

    $: viewMode = $slidesOptions.mode || "grid"
    $: background = layoutSlide.background ? show.media[layoutSlide.background] : null

    let ghostBackground: Media | null = null
    $: if (!background) {
        ghostBackground = null
        layoutSlides.forEach((a, i) => {
            if (i <= index) {
                if (a.actions?.clearBackground && (!a.disabled || i === index)) ghostBackground = null
                else if (a.background && !a.disabled) ghostBackground = show.media[a.background]
            }
        })
    }

    $: bg = clone(background || ghostBackground)
    $: cloudId = $driveData.mediaId
    $: if (bg) locateBackground()
    async function locateBackground() {
        let showId = $activeShow!.id
        let mediaId = layoutSlide.background!

        let checkCloud = cloudId && cloudId !== "default"
        if (checkCloud) {
            let cloudBg = bg.cloud?.[cloudId]
            if (cloudBg) bg.path = cloudBg
        }

        if (!background || $checkedFiles.includes(bg.path)) return

        checkedFiles.set([...$checkedFiles, bg.path])
        let exists = (await checkMedia(bg.path)) === "true"

        // check for other potentially mathing mediaFolders
        if (!exists) {
            let fileName = getFileName(bg.path)
            send(MAIN, ["LOCATE_MEDIA_FILE"], { fileName, splittedPath: splitPath(bg.path), folders: Object.values($mediaFolders).map((a) => a.path), ref: { showId, mediaId, cloudId: checkCloud ? cloudId : "" } })
            return
        }

        if (!checkCloud) return

        // set cloud path to bg.path
        showsCache.update((a) => {
            let media = a[showId].media[mediaId]
            if (!media.cloud) a[showId].media[mediaId].cloud = {}
            a[showId].media[mediaId].cloud![cloudId] = bg.path

            return a
        })
    }

    let duration: number = 0

    let mediaStyle: MediaStyle = {}
    $: if (bg?.path) mediaStyle = getMediaStyle($media[bg.path], currentStyle)

    $: group = slide.group
    $: if (slide.globalGroup && $groups[slide.globalGroup]) {
        group = $groups[slide.globalGroup].default ? $dictionary.groups?.[$groups[slide.globalGroup].name] : $groups[slide.globalGroup].name
        color = $groups[slide.globalGroup].color
        // history({ id: "UPDATE", save: false, newData: { data: group, key: "slides", keys: [layoutSlide.id], subkey: "group" }, oldData: { id: $activeShow?.id }, location: { page: "show", id: "show_key" } })
        // history({ id: "UPDATE", save: false, newData: { data: color, key: "slides", keys: [layoutSlide.id], subkey: "color" }, oldData: { id: $activeShow?.id }, location: { page: "show", id: "show_key" } })
    }

    $: name = getGroupName(layoutSlide.id)
    // dynamic counter
    function getGroupName(slideID: string) {
        let name = group
        if (name === null || name === undefined) return name

        if (!name.length) name = "—"
        let added: any = {}
        if (!$groupNumbers) return name

        // different slides with same name
        let slides = keysToID(show.slides)
        // sort by order when just one layout
        if (Object.keys(show.layouts).length < 2) {
            let layoutSlides = Object.values(show.layouts)[0]?.slides?.map(({ id }) => id) || []
            slides = slides.sort((a, b) => layoutSlides.indexOf(a.id) - layoutSlides.indexOf(b.id))
        }
        slides.forEach((slide: any) => {
            if (!slide) return
            if (added[slide.group]) {
                added[slide.group]++
                if (slide.id === slideID) name += " " + added[slide.group]
            } else added[slide.group] = 1
        })

        // same group count
        added = {}
        GetLayoutRef().forEach((a: any, i: number) => {
            if (a.type === "parent") {
                if (added[a.id]) {
                    added[a.id]++
                    if (i === index) name += " (" + added[a.id] + ")"
                } else added[a.id] = 1
            }
        })

        return name
    }

    // quick edit
    let html: string = ""
    let previousHTML: string = ""
    let longest: any = null

    onMount(() => {
        let texts: any[] = slide.items?.map((item) => getItemText(item))
        if (!texts) return
        let prev: any = null
        texts.forEach((a, i) => {
            if (!prev || a.length > prev) {
                prev = a.length
                longest = i
            }
        })
        if (longest !== null) update()
    })

    function update() {
        // html = `<div class="align" style="${item.align}">`
        html = ""
        slide.items[longest]?.lines?.forEach((line) => {
            line.text?.forEach((a) => {
                html += a.value
            })
        })
        previousHTML = html
    }

    // || $showsCache[active].slides
    let textElem: any
    $: if (textElem && html !== previousHTML) {
        previousHTML = html
        setTimeout(() => {
            showsCache.update((a) => {
                let lines = a[$activeShow!.id].slides[layoutSlide.id].items[longest].lines
                let textItems = getItems(textElem.children)
                if (textItems.length) {
                    lines?.forEach((line) => {
                        line.text?.forEach((a, i) => (a.value = textItems[i]))
                    })
                }
                return a
            })
        }, 10)
    }

    function getItems(children: any): any[] {
        let textItems: any[] = []
        new Array(...children).forEach((child: any) => {
            if (child.innerHTML) textItems.push(child.innerHTML)
        })
        return textItems
    }

    let timer: number[] = []
    $: if ($activeTimers) {
        timer = []
        slide.items?.forEach(checkItem)
    }
    function checkItem(item: any) {
        if (item?.type !== "timer") return

        $activeTimers.forEach((a, i) => {
            if (a.showId === $activeShow?.id && a.slideId === layoutSlide.id && a.id === item.timer.id) timer.push(i)
        })
    }

    $: resolution = getResolution(slide?.settings?.resolution, { $outputs, $styles })

    $: currentOutput = $outputs[getActiveOutputs()[0]]
    $: currentStyle = $styles[currentOutput?.style || ""] || {}

    let colorStyle: string = ""
    let style: string = ""
    $: {
        colorStyle = ""
        style = ""
        // $fullColors &&
        if (viewMode !== "lyrics" || noQuickEdit) colorStyle += `background-color: ${color};`
        if (!$fullColors && (viewMode !== "lyrics" || noQuickEdit)) colorStyle += `color: ${color};`
        if (viewMode === "lyrics" && !noQuickEdit) colorStyle += "background-color: transparent;"
        if (viewMode !== "grid" && viewMode !== "simple" && !noQuickEdit && viewMode !== "lyrics") style += `width: calc(${100 / columns}% - 6px)`
    }

    $: slideFilter = ""
    $: if (!layoutSlide.filterEnabled || layoutSlide.filterEnabled?.includes("background")) getSlideFilter()
    else slideFilter = ""
    function getSlideFilter() {
        slideFilter = ""
        if (layoutSlide.filter) slideFilter += "filter: " + layoutSlide.filter + ";"
        if (layoutSlide["backdrop-filter"]) slideFilter += "backdrop-filter: " + layoutSlide["backdrop-filter"] + ";"
    }

    $: if ($refreshListBoxes >= 0) {
        setTimeout(() => {
            refreshListBoxes.set(-1)
        }, 100)
    }
</script>

<!-- TODO: faster loading ? lazy load images? -->
<!-- https://svelte.dev/repl/3bf15c868aa94743b5f1487369378cf3?version=3.21.0 -->
<!-- animate:flip -->
<div class="main" class:active class:focused style="{output?.color ? 'outline: 2px solid ' + output.color + ';' : ''}width: {viewMode === 'grid' || viewMode === 'simple' || noQuickEdit ? 100 / columns : 100}%;">
    <!-- group box -->
    {#if $fullColors}
        <div class="group_box" style="background-color: {color};" />
    {/if}
    <!-- icons -->
    {#if icons && !altKeyPressed && viewMode !== "simple"}
        <Icons {timer} {layoutSlide} {background} {duration} {columns} {index} style={viewMode === "lyrics" ? "padding-top: 23px;" : ""} />
        <Actions {columns} {index} actions={layoutSlide.actions || {}} />
    {/if}
    <!-- content -->
    <div class="slide context #{name === null ? 'slideChild' : 'slide'}" class:disabled={layoutSlide.disabled} class:afterEnd={endIndex !== null && index > endIndex} {style} tabindex={0} on:click>
        <div class="hover overlay" />
        <!-- <DropArea id="slide" hoverTimeout={0} file> -->
        <div style="width: 100%;height: 100%;">
            <SelectElem style={colorStyle} id="slide" data={{ index }} draggable trigger={list ? "column" : "row"}>
                <!-- TODO: tab select on enter -->
                {#if viewMode === "lyrics" && !noQuickEdit}
                    <!-- border-bottom: 1px dashed {color}; -->
                    <div class="label" title={name || ""} style="color: {color};margin-bottom: 5px;">
                        <span style="position: absolute;display: contents;">{index + 1}</span>
                        <span class="text">{name === null ? "" : name || "—"}</span>
                    </div>
                {/if}
                <Zoomed
                    background={slide.items?.length && (viewMode !== "lyrics" || noQuickEdit) ? slide.settings.color || currentStyle.background || "black" : "transparent"}
                    let:ratio
                    {resolution}
                    zoom={viewMode !== "lyrics" || noQuickEdit}
                    aspectRatio={viewMode !== "lyrics" || noQuickEdit}
                    disableStyle={viewMode === "lyrics" && !noQuickEdit}
                    relative={viewMode === "lyrics" && !noQuickEdit}
                >
                    {#if !altKeyPressed && bg && (viewMode !== "lyrics" || noQuickEdit)}
                        <div class="background" style="zoom: {1 / ratio};{slideFilter}" class:ghost={!background}>
                            <MediaLoader
                                name={$dictionary.error?.load}
                                path={bg.path || bg.id || ""}
                                cameraGroup={bg.cameraGroup || ""}
                                type={bg.type !== "player" ? bg.type : null}
                                loadFullImage={!!(bg.path || bg.id)}
                                ghost={!background}
                                {mediaStyle}
                                bind:duration
                            />
                        </div>
                    {/if}
                    {#if slide.items}
                        {#each slide.items as item, i}
                            {#if item && (viewMode !== "lyrics" || item.type === undefined || ["text", "events", "list"].includes(item.type))}
                                <Textbox
                                    filter={layoutSlide.filterEnabled?.includes("foreground") ? layoutSlide.filter : ""}
                                    backdropFilter={layoutSlide.filterEnabled?.includes("foreground") ? layoutSlide["backdrop-filter"] : ""}
                                    disableListTransition
                                    {item}
                                    itemIndex={i}
                                    {ratio}
                                    slideIndex={index}
                                    ref={{
                                        showId: $activeShow?.id,
                                        slideId: layoutSlide.id,
                                        id: layoutSlide.id,
                                    }}
                                    style={viewMode !== "lyrics" || noQuickEdit}
                                    smallFontSize={viewMode === "lyrics" && !noQuickEdit}
                                />
                            {/if}
                        {/each}
                    {/if}
                    {#if !altKeyPressed && layoutSlide.overlays?.length && (viewMode !== "lyrics" || noQuickEdit)}
                        {#each layoutSlide.overlays as id}
                            {#if $overlays[id]}
                                {#each $overlays[id].items as item}
                                    <Textbox {item} ref={{ type: "overlay", id }} />
                                {/each}
                            {/if}
                        {/each}
                    {/if}
                </Zoomed>
                {#if viewMode === "simple"}
                    {#if output?.maxLines}
                        <div class="lineProgress">
                            <div class="fill" style="width: {((output.line + 1) / output.maxLines) * 100}%;background-color: {output.color};" />
                        </div>
                    {/if}

                    <div title={name || ""} style="height: 2px;" />
                {:else if viewMode !== "lyrics" || noQuickEdit}
                    <!-- style="width: {resolution.width * zoom}px;" -->
                    <div class="label" title={name || ""} style={$fullColors ? `background-color: ${color};color: ${getContrast(color || "")};` : `border-bottom: 2px solid ${color};`}>
                        {#if name === null && $fullColors}
                            <!-- WIP this works fine without full colors, but is it neccesary? (UI vs UX) -->
                            <div class="childLink" style="background-color: {color};" class:full={$fullColors} />
                        {/if}
                        {#if output?.maxLines}
                            <div class="lineProgress">
                                <div class="fill" style="width: {((output.line + 1) / output.maxLines) * 100}%;background-color: {output.color};" />
                            </div>
                        {/if}
                        {#if slide.notes && icons}<p class="notes">{slide.notes}</p>{/if}
                        <!-- <div class="label" title={name || ""} style="border-bottom: 2px solid {color};"> -->
                        <!-- font-size: 0.8em; -->
                        <span style="position: absolute;display: contents;">{index + 1}</span>
                        <span class="text">{name === null ? "" : name || "—"}</span>
                    </div>
                {/if}
            </SelectElem>
        </div>
        <!-- </DropArea> -->
    </div>
    {#if viewMode === "list" && !noQuickEdit}
        <hr />
        <!-- <div bind:this={textElem} class="quickEdit edit" tabindex={0} contenteditable bind:innerHTML={html}>
      {@html html}
    </div> -->
        <div class="quickEdit" style="font-size: {(-1.1 * $slidesOptions.columns + 12) / 6}em;" data-index={index}>
            {#key $refreshListBoxes >= 0 && $refreshListBoxes !== index}
                {#if slide.items}
                    {#each slide.items as item, itemIndex}
                        {#if item.lines}
                            <Editbox {item} ref={{ showId: $activeShow?.id, id: layoutSlide.id }} editIndex={index} index={itemIndex} plain />
                        {/if}
                    {/each}
                {/if}
            {/key}
        </div>
    {/if}
</div>

<style>
    .main {
        display: flex;
        position: relative;
        padding: 2px;
        /* height: fit-content; */
    }

    .slide {
        /* padding: 3px; */
        background-color: var(--primary-darker);
        z-index: 0;
        outline-offset: 0;
        width: 100%;

        position: relative;
        display: flex;

        /* height: fit-content; */
        /* border: 2px solid var(--primary-lighter); */
    }

    .slide :global(.isSelected) {
        outline: 5px solid var(--secondary-text) !important;
    }

    .main.focused {
        outline: 2px solid var(--secondary-opacity);
        outline-offset: -1px;
        z-index: 2;
    }
    .main.active {
        /* outline: 3px solid var(--secondary); */
        outline: 2px solid var(--secondary);
        outline-offset: -1px;
        z-index: 2;
    }

    .group_box {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;

        opacity: 0.25;
    }

    .slide.afterEnd {
        opacity: 0.7;
    }
    .slide.disabled {
        opacity: 0.2;
    }

    .slide:hover > .hover {
        /* background-color: var(--primary-lighter); */
        /* filter: brightness(1.1); */
        opacity: 1;
    }
    .hover {
        pointer-events: none;
        width: 100%;
        height: 100%;
        opacity: 0;
        background-color: rgb(255 255 255 / 0.05);
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
    }

    .background {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
    }
    .background.ghost {
        opacity: 0.4;
    }
    .background :global(img) {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .label {
        position: relative;
        background-color: var(--primary-darkest);
        display: flex;
        padding: 5px;
        padding-bottom: 3px;
        font-size: 0.8em;
        font-weight: bold;
        align-items: center;
        /* opacity: 0.8; */
    }

    .childLink {
        position: absolute;
        left: 0;
        bottom: 0;
        transform: translate(-100%, 100%);
        width: 12px;
        height: 2px;
    }
    .childLink.full {
        transform: translate(-100%, 0);
        height: 24px;
    }

    .lineProgress {
        position: absolute;
        top: 0;
        left: 0;
        transform: translateY(-100%);
        width: 100%;
        height: 2px;
        z-index: 2;
        background-color: var(--primary-darkest);
    }
    .lineProgress .fill {
        width: 0;
        height: 100%;
        background-color: var(--secondary);
    }

    .notes {
        position: absolute;
        top: 0;
        left: 0;
        transform: translateY(-100%);
        width: 100%;
        padding: 4px 8px;
        background-color: rgb(0 0 0 / 0.5);
        color: white;
        font-weight: normal;
    }

    .label .text {
        width: 100%;
        margin: 0 20px;
        text-align: center;
        overflow-x: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    hr {
        height: 100%;
        width: 3px;
        border: none;
        margin: 0 10px;
        background-color: var(--primary-lighter);
    }

    .quickEdit {
        display: flex;
        flex-direction: column;
        gap: 10px;
        justify-content: space-between;

        background-color: rgb(0 0 0 / 0.8);
        color: white;
        padding: 10px;
        flex: 1;

        z-index: 2;
    }
    .quickEdit :global(.editItem) {
        height: 100%;
    }

    .quickEdit :global(.placeholder) {
        top: 0;
        height: 100%;
        padding: 15px 0;
        width: unset !important;
        /* font-size: 1.5em; */
    }
</style>
