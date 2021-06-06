import type { RedFrontend } from './red-ui';

declare const RED: RedFrontend;
export const globalSCript = () => {
    RED.events.on("links:add", newLink => {
        RED.editor.validateNode(newLink.source);
        RED.editor.validateNode(newLink.target);
    })
}