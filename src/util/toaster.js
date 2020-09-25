import { Position, Toaster } from "@blueprintjs/core";

export const toaster = Toaster.create({
    position: Position.BOTTOM_RIGHT,
});

export const mainToaster = Toaster.create({
    position: Position.TOP,
});