import {RemId, RichTextElementInterface} from "@remnote/plugin-sdk";

export interface PromptParam {
  remId: RemId 
  name: RichTextElementInterface[];
  idx: number
  promptRichText: RichTextElementInterface[];
}
