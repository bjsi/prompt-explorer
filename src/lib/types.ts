import {RemId, RichTextElementInterface} from "@remnote/plugin-sdk";

export interface PromptParam {
  remId: RemId 
  name: string;
  promptRichText: RichTextElementInterface[];
}
