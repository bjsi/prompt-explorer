import { filterAsync, RemType, renderWidget, RICH_TEXT_FORMATTING, usePlugin, useRunAsync, useTracker, WidgetLocation } from "@remnote/plugin-sdk";
import { contextCode, workflowCode } from "../lib/consts";

export function SuggestPrompts() {
    const plugin = usePlugin();
    const ctx = useRunAsync(async () => await plugin.widget.getWidgetContext<WidgetLocation.DocumentBelowTitle>(), [])
    const remId = ctx?.documentId;
    const rem = useTracker((rp) => rp.rem.findOne(remId), [remId]);
    // TODO: add plain prompts too
    const workflows = useTracker(async () => {
        const pu = await plugin.powerup.getPowerupByCode(workflowCode);
        if (!pu || !rem) {
            return []
        }
        const tagged = await pu.taggedRem();
        const filtered = await filterAsync(tagged, async x => {
            const ctxs = await x.getPowerupPropertyAsRichText(workflowCode, contextCode);
            const ctxPredicateCodes = ctxs.filter(x => x.i === RICH_TEXT_FORMATTING.QUOTE);
            function isConcept() {
                return rem?.type == RemType.CONCEPT;
            }
        })
        // const children = await rem.getChildrenRem() || [];
        // const context = children.find(c => c.text?.[0] === "annotate")
    }, [rem])
    return (
        <div>
        </div>
    )
}

renderWidget(SuggestPrompts)