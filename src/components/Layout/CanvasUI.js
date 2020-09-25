import React, { Component } from "react";
import { toaster } from "../../util/toaster";
import {
    cpixIntToValues, cpixValuesToInt, intToValues, compareProps, randomize2dArray,
    flip2dArrayHorizontally, flip2dArrayVertically
} from "../../util/functions";

// Style
import { Menu, MenuItem, ContextMenu, Intent } from '@blueprintjs/core';

// Redux
import { connect } from "react-redux";
import { update as canvasUiUpdate, changeMode } from '../../redux/actions/canvasUiActions';
import { update as charPanelUpdate } from '../../redux/actions/charPanelActions';
import { update as colorPanelUpdate } from '../../redux/actions/colorPanelActions';
import { draw, erase, drawSingle, eraseSingle, drawRefs } from '../../redux/actions/documentActions';
import { update as brushesUpdate, addBrush } from '../../redux/actions/brushesActions';

export class CanvasUI extends Component {
    state = {
        mouseX: null,
        mouseY: null,
        mouseDown: false,
        contextMenuOpen: false,
    };

    windowEventListeners = {
        "mouseup": "handleMouseUp",
        "keydown": "handleKeyDown",
        "keyup": "handleKeyUp",
        // "wheel": "handleWheel",
    }

    layerRef = React.createRef();

    componentDidMount() {
        this.ctx = this.layerRef.current.getContext("2d");
        this.ctx.webkitImageSmoothingEnabled = false;
        this.setupLayerProperties();

        // hook not canvas-bound events to window
        Object.entries(this.windowEventListeners).forEach((event) => {
            window.addEventListener(event[0], this[event[1]], event[0] === "wheel");
        });
    }

    componentWillUnmount() {
        // Remove window event listeners
        Object.entries(this.windowEventListeners).forEach((event) => {
            window.removeEventListener(event[0], this[event[1]]);
        });
    }

    componentDidUpdate() {
        this.setupLayerProperties();
        this.drawUi();
    }

    setupLayerProperties = () => {
        const { resolution, ppb, cpc, text_margin } = this.props;
        this.char_height = (ppb / resolution);
        this.char_width = (ppb / resolution) / cpc;
        this.fontSize = this.char_height - text_margin;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
    }

    /* -------------------------------------------------------------------------- */
    /*                               EVENT HANDLERS                               */
    /* -------------------------------------------------------------------------- */
    xWheelQuota = 0;
    yWheelQuota = 0;
    handleWheel = (e) => {
        const { mode, previewOffset, selectionToMove, shiftDown, altDown, selectedBrush, brushes } = this.props;
        if (altDown) return; //this is handled by drawboard
        if (mode !== "brush" && mode !== "select") return;
        if (mode === "select" && !selectionToMove) return;
        e.stopPropagation();

        // handle moving char / color selection with 2d wheel
        const moveX = Math.abs(this.xWheelQuota) > 190 ? Math.sign(this.xWheelQuota) : 0;
        const moveY = Math.abs(this.yWheelQuota) > 190 ? Math.sign(this.yWheelQuota) : 0;
        if (moveX === 0 && moveY === 0) {
            if (moveX === 0) this.xWheelQuota = this.xWheelQuota + e.deltaX;
            if (moveY === 0) this.yWheelQuota = this.yWheelQuota + e.deltaY;
            return;
        } else {
            if (moveX !== 0) this.xWheelQuota = 0;
            if (moveY !== 0) this.yWheelQuota = 0;
        }

        if (shiftDown && mode === "brush") {
            if (selectedBrush === null) {
                this.props.brushesUpdate({ selectedBrush: 0 });
            } else {
                let newIndex = selectedBrush;

                const preMoveX = newIndex + moveX;
                if (preMoveX <= brushes.length - 1 && preMoveX >= 0) newIndex += moveX;

                const preMoveY = newIndex + (5 * moveY);
                if (preMoveY <= brushes.length - 1 && preMoveY >= 0) newIndex += (5 * moveY);

                if (newIndex !== selectedBrush) this.props.brushesUpdate({ selectedBrush: newIndex });
            }
        } else {
            this.props.canvasUiUpdate({
                previewOffset: {
                    x: (previewOffset?.x ?? 0) - moveX,
                    y: (previewOffset?.y ?? 0) - moveY,
                }
            });
        }

    }

    handleKeyDown = (e) => {
        if (e.target !== document.body) return; // ducktape fix for kezeping shortcuts to

        // Non-single modifier pressed Actions
        const { mode, textStartColumn, selection, selectedLayer, ctrlDown, selectedBrush, selectionToMove, randomizeBrush, flipBrushVertically, flipBrushHorizontally } = this.props;

        // * Mode switching shortcuts
        // if ctrl 1 - 9
        if (ctrlDown && e.keyCode > 48 && e.keyCode < 58) {
            e.preventDefault();
            const pressedNumber = e.keyCode - 48;
            const tabs = { 1: "draw", 2: "color", 3: "brush", 4: "text", 5: "select", 6: "erase" };
            this.props.changeMode(tabs[pressedNumber]);
            // this.props.canvasUiUpdate({ mode: tabs[pressedNumber] });
            return; // for readibility
        }

        if (!ctrlDown && (mode !== "text" || (mode === "text" && textStartColumn === null))) {
            if (e.key === "s") this.props.changeMode("select");
            if (e.key === "e") this.props.changeMode("erase");
            if (e.key === "t") this.props.changeMode("text");
            if (e.key === "b") this.props.changeMode("brush");
            if (e.key === "c") this.props.changeMode("color");
            if (e.key === "d") this.props.changeMode("draw");
        }

        // on ctrl + v
        if (mode === "select" && selection && ctrlDown && e.keyCode === 86) {
            this.pasteClipboard();
            return;
        }

        // on selection mode, has a selection and tries to cut, copy, delete or make brush
        if (mode === "select" && selection && [67, 88, 66, 8, 46, 27, 72, 86, 82].includes(e.keyCode)) {
            // if ctrl + c, x or v
            if (ctrlDown) {
                if (e.keyCode === 67) this.copySelection();
                else if (e.keyCode === 88) this.cutSelection();
                else if (e.keyCode === 66) this.selectionToBrush();
            } else {
                if ([8, 46].includes(e.keyCode)) this.removeSelection(); // SUPR or BACKSPACE
                if (e.keyCode === 27) this.cancelSelection(); // ESC

                //flip
                if (selectionToMove) {
                    if (e.keyCode === 82) { // r
                        this.props.canvasUiUpdate({ selectionToMove: randomize2dArray(selectionToMove) });
                    } else if (e.keyCode === 86) { // v
                        this.props.canvasUiUpdate({ selectionToMove: flip2dArrayVertically(selectionToMove) });
                    } else if (e.keyCode === 72) { // h
                        this.props.canvasUiUpdate({ selectionToMove: flip2dArrayHorizontally(selectionToMove) });
                    }
                } else {
                    // r
                    if (e.keyCode === 82) this.randomizeSelection();
                    // v
                    else if (e.keyCode === 86) this.flipSelectionVertically();
                    // h
                    else if (e.keyCode === 72) this.flipSelectionHorizontally();
                }
            }
            return;
        }

        if (mode === "brush") {
            if (selectedBrush !== null) {
                if (e.keyCode === 27) this.props.brushesUpdate({ selectedBrush: null }); // ESC
            }

            if (e.keyCode === 82) { // r
                this.props.brushesUpdate({ randomizeBrush: !randomizeBrush });
            } else if (e.keyCode === 86) { // v
                this.props.brushesUpdate({ flipBrushVertically: !flipBrushVertically });
            } else if (e.keyCode === 72) { // h
                this.props.brushesUpdate({ flipBrushHorizontally: !flipBrushHorizontally });
            }
        }

        // If text mode and text column is set
        if (mode === "text" && textStartColumn >= 0) {
            e.preventDefault(); // prevent default behaviors like arrow keys, letters, etc

            // Escape
            if (e.keyCode === 27) this.props.canvasUiUpdate({ textStartColumn: null, selection: null });
            // Enter
            if (e.keyCode === 13) this.props.canvasUiUpdate({ selection: { x: textStartColumn, y: selection.y + 1 } });
            // left arrow
            if (e.keyCode === 37) this.props.canvasUiUpdate({ selection: { x: selection.x - 1, y: selection.y } });;
            // up arrow
            if (e.keyCode === 38) this.props.canvasUiUpdate({ selection: { x: selection.x, y: selection.y - 1 } });;
            // right arrow
            if (e.keyCode === 39) this.props.canvasUiUpdate({ selection: { x: selection.x + 1, y: selection.y } });;
            // down arrow
            if (e.keyCode === 40) this.props.canvasUiUpdate({ selection: { x: selection.x, y: selection.y + 1 } });;

            // backspace
            if (e.keyCode === 8) {
                this.props.canvasUiUpdate({ selection: { x: selection.x - 1, y: selection.y } });
                this.props.eraseSingle(selection.x - 1, selection.y, selectedLayer);
            }
            // supr / delete
            if (e.keyCode === 46) {
                this.props.canvasUiUpdate({ selection: { x: selection.x + 1, y: selection.y } });
                this.props.eraseSingle(selection.x + 1, selection.y, selectedLayer);
            };

            // if  printable chars pressed, draw them
            if (e.key.length === 1) {
                const { selectedFgColor: fg, selectedBgColor: bg, selectedLayer, color_palette, textModeFont } = this.props;
                if (textModeFont === 0) return;
                const charCode = e.key.charCodeAt(0);
                let char = cpixValuesToInt(textModeFont, charCode);
                if (charCode === 32) char = null;
                this.props.drawSingle([char, color_palette[fg], color_palette[bg]], selection.x, selection.y, selectedLayer);
                this.props.canvasUiUpdate({ selection: { x: selection.x + 1, y: selection.y } });
            }
            return;
        }

    }


    handleMouseDown = (e) => {
        if (e.button !== 0) return;
        this.setState({ mouseDown: true });

        const { mode, selection, selectionToMove, selectedBrush } = this.props;
        const { mouseX, mouseY } = this.state;

        if (mode === "brush" && selectedBrush !== null) {
            this.drawBrush();
        } else if (mode === "select") {

            if (selection && this.isCursorInsideSelection()) {
                this.selectionToMoving();
            } else if (selectionToMove) {
                this.moveSelection();
            } else {
                this.props.canvasUiUpdate({
                    selection: { x: mouseX, y: mouseY },
                    selectionEnd: { x: mouseX, y: mouseY },
                });
            }
        } else {
            this.props.canvasUiUpdate({
                selection: { x: mouseX, y: mouseY },
            });
            if (mode === "text") {
                this.props.canvasUiUpdate({ textStartColumn: mouseX });
            }

            this.drawCandidateIfAllowed(mouseX, mouseY);
        }
    }

    handleMouseUp = () => {
        this.setState({ mouseDown: false });
        if (this.props.mode !== "text" && this.props.mode !== "select") {
            this.props.canvasUiUpdate({
                selection: null
            })
        }
    }

    handleMouseMove = (e) => {
        const { width, height, top, left } = this.layerRef.current.getBoundingClientRect();
        const scale = width / this.props.width; // original width / current width

        const mouseX = e.clientX - left;
        const mouseY = e.clientY - top;
        const cellX = Math.floor(mouseX / (this.char_width * scale));
        const cellY = Math.floor(mouseY / (this.char_height * scale));

        // nothing if outside of element
        if (cellX < 0 || cellY < 0) return;
        // if bigger than grid
        if (cellY > this.props.grid.length - 1) return;
        if (cellX > this.props.grid[0].length - 1) return;

        if (this.state.mouseX !== cellX || this.state.mouseY !== cellY) {
            this.handleCellMove(cellX, cellY);
        }
    }

    handleCellMove = (x, y) => {
        this.setState({ mouseX: x, mouseY: y });

        const { mode, selectionToMove, selectedBrush } = this.props;
        if (this.state.mouseDown) {
            // set for rendering and other uses
            if (mode === "select") {
                if (!selectionToMove) {
                    this.props.canvasUiUpdate({ selectionEnd: { x, y } })
                }
            } else if (mode === "brush" && selectedBrush !== null) {
                this.drawBrush();
            } else {
                this.props.canvasUiUpdate({ selection: { x, y } })
                this.drawCandidateIfAllowed(x, y);
            }

        }
    }

    getDrawCandidateCpix = () => {
        const {
            ctrlDown, selectedPaletteChar, selectedBrowserChar, selectedFgColor, selectedBgColor,
        } = this.props;

        // Colors to use
        let fg = this.props.color_palette[selectedFgColor];
        let bg = this.props.color_palette[selectedBgColor];

        if (this.props.selectedColorTab === "color_browser") {
            if (ctrlDown) {
                bg = this.props.selectedBrowserColor;
                if (this.props.options.noColorSetForBrowserCounterpart) fg = undefined;
            } else {
                fg = this.props.selectedBrowserColor;
                if (this.props.options.noColorSetForBrowserCounterpart) bg = undefined;
            }
        }

        const paletteChar = this.props.char_palette[selectedPaletteChar];
        const browserChar = selectedBrowserChar; // we get char value directly, not index

        let char;
        if (this.props.selectedCharTab === "char_palette") char = paletteChar;
        else if (this.props.selectedCharTab === "char_browser") char = browserChar;

        return [char, fg, bg];
    }

    drawCandidateIfAllowed = (x, y) => {
        const { mode, selectedLayer } = this.props;
        const [char, fg, bg] = this.getDrawCandidateCpix();

        if (mode === "draw") {
            this.props.drawSingle([char, fg, bg], x, y, selectedLayer);
        } else if (mode === "color") {
            this.props.drawSingle([undefined, fg, bg], x, y, selectedLayer);
        } else if (mode === "erase") {
            this.props.eraseSingle(x, y, selectedLayer);
        }
    }

    handleRightClick = (e) => {
        const { mode, selection, selectionToMove, shiftDown, ctrlDown, clipboard } = this.props;
        const { mouseX, mouseY } = this.state;
        const [char, fg, bg] = intToValues(this.props.grid[mouseY][mouseX]);

        // Regardless of mode, shift / ctrl right click absorbs target colot
        if (ctrlDown && !shiftDown) {
            this.props.colorPanelUpdate({ selectedTab: "color_palette", bgSelection: bg });
        } else if (shiftDown && !ctrlDown) {
            this.props.colorPanelUpdate({ selectedTab: "color_palette", fgSelection: fg });
        } else if (shiftDown && ctrlDown) {
            this.props.colorPanelUpdate({ selectedTab: "color_palette", fgSelection: fg, bgSelection: bg });
        }

        if (mode === "draw") {
            if (!shiftDown && !ctrlDown) {
                this.props.charPanelUpdate({ selectedTab: "char_palette", charPaletteSelection: char });
                this.props.colorPanelUpdate({ selectedTab: "color_palette", fgSelection: fg, bgSelection: bg });
            }
        }

        if (mode === "color" || mode === "text") {
            if (!ctrlDown && !shiftDown) {
                this.props.colorPanelUpdate({ selectedTab: "color_palette", fgSelection: fg, bgSelection: bg });
            }
        }

        if (mode === "select" && (!shiftDown && !ctrlDown)) {
            const cursorInside = this.isCursorInsideSelection();
            let justSelected = false;
            if (!selection || (selection && !cursorInside && !selectionToMove)) {
                this.props.canvasUiUpdate({
                    selection: { x: mouseX, y: mouseY },
                    selectionEnd: { x: mouseX, y: mouseY }
                });
                justSelected = true;
            }
            if ((justSelected || cursorInside) && !selectionToMove) {
                ContextMenu.show(
                    (
                        <Menu>
                            <MenuItem icon="move" onClick={this.selectionToMoving} text="Move" />
                            <MenuItem icon="style" onClick={this.selectionToBrush} text="Add as brush" />
                            <Menu.Divider />
                            <MenuItem icon="draw" onClick={this.completeFill} text="Complete Fill (char + FG + BG)" />
                            <MenuItem icon="font" onClick={this.charFill} text="Char Fill (char + FG)" />
                            <MenuItem icon="tint" onClick={this.backgroundFill} text="Background FIll (BG)" />
                            <Menu.Divider />
                            <MenuItem icon="duplicate" onClick={this.copySelection} text="Copy" />
                            <MenuItem icon="cut" onClick={this.cutSelection} text="Cut" />
                            <MenuItem icon="clipboard" onClick={this.pasteClipboard} text="Paste" disabled={!clipboard} />
                            <MenuItem icon="delete" onClick={this.removeSelection} text="Remove" />
                        </Menu>
                    ), { top: e.clientY, left: e.clientX }, null, true
                );
            } else {
                this.cancelSelection();
            }
        }
    }


    /* -------------------------------------------------------------------------- */
    /*                                   DRAWING                                  */
    /* -------------------------------------------------------------------------- */

    drawCursor = () => {
        const { mouseX: x, mouseY: y } = this.state;
        const xPos = x * this.char_width;
        const yPos = y * this.char_height;

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#777777";
        this.ctx.strokeRect(
            xPos + 1, yPos + 1,
            this.char_width - 2, this.char_height - 2
        );
    }

    drawTextCursor = () => {
        const { textStartColumn } = this.props;
        if (!textStartColumn) return;
        const xPos = textStartColumn * this.char_width;

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "green";

        this.ctx.beginPath();
        this.ctx.moveTo(xPos, 0);
        this.ctx.lineTo(xPos, this.props.height);
        this.ctx.stroke();
    }

    drawPreview = () => {
        const { mouseX, mouseY } = this.state;
        const { mode, selectionToMove, selectedBrush, brushes, previewOffset, flipBrushVertically, randomizeBrush, flipBrushHorizontally, ctrlDown } = this.props;
        if (mode === "draw") {
            const cpix = this.getDrawCandidateCpix();
            this.drawCpixPreview(cpix, mouseX, mouseY);
        } else if (mode === "brush" && selectedBrush !== null) {
            const xPos = mouseX - (previewOffset?.x ?? 0);
            const yPos = mouseY - (previewOffset?.y ?? 0);
            let brush = brushes[selectedBrush];
            if (flipBrushVertically) brush = flip2dArrayVertically(brush);
            if (flipBrushHorizontally) brush = flip2dArrayHorizontally(brush);
            if (ctrlDown || randomizeBrush) brush = randomize2dArray(brush);
            this.drawCpixsPreview(brush, xPos, yPos, true);
        } else if (mode === "select" && selectionToMove) {
            const xPos = mouseX - (previewOffset?.x ?? 0);
            const yPos = mouseY - (previewOffset?.y ?? 0);
            this.drawCpixsPreview(selectionToMove, xPos, yPos, true);
        }
    }

    drawCpixsPreview = (cpixs, xStart, yStart, refs = false) => {
        for (let y = 0; y < cpixs.length; y++) {
            for (let x = 0; x < cpixs[0].length; x++) {
                this.drawCpixPreview(cpixs[y][x], xStart + x, yStart + y, refs);
            }
        }
    }

    drawCpixPreview = (values, x, y, refs = false) => {
        let char, fgColor, bgColor;
        if (refs) {
            values = intToValues(values);
            char = this.props.char_palette[values[0]];
            fgColor = this.props.color_palette[values[1]];
            bgColor = this.props.color_palette[values[2]];
        } else {
            char = values[0];
            fgColor = values[1];
            bgColor = values[2];
        }

        const visibleChar = char && fgColor;
        if (!visibleChar && !bgColor) return; // if cpix has no visibility, we skip

        // Draw background
        if (bgColor) {
            this.ctx.fillStyle = bgColor + "55";
            this.ctx.fillRect(
                x * this.char_width, y * this.char_height,
                this.char_width, this.char_height
            );
        }

        // Draw text
        if (visibleChar) {
            const [fontIndex, charUnicode] = cpixIntToValues(char);
            const fontName = this.props.fonts[fontIndex];
            this.ctx.font = `${this.props.text_weight} ${this.fontSize}px "${fontName}", "Adobe Blank"`;

            this.ctx.fillStyle = fgColor + "55";

            const center_x = (x * this.char_width) + (this.char_width / 2);
            const center_y = (y * this.char_height) + (this.char_height / 2);
            this.ctx.fillText(String.fromCharCode(charUnicode), center_x, center_y);
        }
    }

    drawUi = () => {
        const { mode } = this.props;
        this.cleanLayer();
        this.drawPreview();
        if (!this.isCursorInsideSelection()) this.drawCursor();
        if (mode === "select") {
            this.drawSelectionArea();
        } else {
            this.drawSelection();
            if (mode === "text") {
                this.drawTextCursor();
            }
        }
    }

    drawSelection = () => {
        if (!this.props.selection) return;
        const { x: startX, y: startY } = this.props.selection;

        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.strokeRect(
            startX * this.char_width + 1,
            startY * this.char_height + 1,
            this.char_width - 2,
            this.char_height - 2,
        );
    }

    drawSelectionArea = () => {
        if (!this.props.selection && !this.props.selectionEnd) return;
        const { x: startX, y: startY } = this.props.selection;
        const { x: endX, y: endY } = this.props.selectionEnd;
        const wSize = (Math.max(startX, endX) - Math.min(startX, endX)) + 1;
        const hSize = (Math.max(startY, endY) - Math.min(startY, endY)) + 1;

        this.ctx.lineWidth = 2;
        if (this.props.selectionToMove) {
            this.ctx.strokeStyle = "#00FFFF55";
        } else {
            this.ctx.strokeStyle = "#00FFFF";
        }
        this.ctx.strokeRect(
            Math.min(startX, endX) * this.char_width + 1,
            Math.min(startY, endY) * this.char_height + 1,
            wSize * this.char_width - 2,
            hSize * this.char_height - 2,
        );
    }

    cleanLayer = () => {
        this.ctx.clearRect(0, 0, this.props.width, this.props.height);
    }

    /* -------------------------------------------------------------------------- */
    /*                               GENERAL ACTIONS                              */
    /* -------------------------------------------------------------------------- */

    removeSelection = () => {
        const { selection, selectionEnd, selectedLayer } = this.props;
        this.props.erase(selection.x, selection.y, selectionEnd.x, selectionEnd.y, selectedLayer);
    }

    retrieveSelectionData = () => {
        const { selection, selectionEnd, grid } = this.props;
        const startRow = Math.min(selection.y, selectionEnd.y);
        const endRow = Math.max(selection.y, selectionEnd.y);
        const rows = grid.slice(startRow, endRow + 1);

        const selectedData = rows.map((row) => {
            const arr = Array.from(row);
            const startColumn = Math.min(selection.x, selectionEnd.x);
            const endColumn = Math.max(selection.x, selectionEnd.x);
            return arr.slice(startColumn, endColumn + 1);
        });

        return selectedData;
    }

    copySelection = () => {
        const selectedData = this.retrieveSelectionData();
        toaster.show({
            message: "Selection copied to clipboard",
            intent: Intent.PRIMARY,
            timeout: 2000
        });
        this.props.canvasUiUpdate({ clipboard: selectedData });
    }

    selectionToMoving = () => {
        const { mouseX, mouseY } = this.state;
        const { selection, selectionEnd } = this.props;

        const selectedData = this.retrieveSelectionData();
        const xOffset = mouseX - Math.min(selection.x, selectionEnd.x);
        const yOffset = mouseY - Math.min(selection.y, selectionEnd.y);
        this.props.canvasUiUpdate({
            selectionToMove: selectedData,
            previewOffset: { x: xOffset, y: yOffset }
        });
    }

    moveSelection = () => {
        const { selectionToMove, selectedLayer, previewOffset } = this.props;
        if (selectionToMove) {
            const { mouseX, mouseY } = this.state;
            this.removeSelection();
            this.props.drawRefs(selectionToMove, mouseX - previewOffset.x, mouseY - previewOffset.y, selectedLayer);
            this.props.canvasUiUpdate({
                selection: null,
                selectionEnd: null,
                selectionToMove: null,
                previewOffset: null
            });
        }
    }

    cutSelection = () => {
        this.copySelection();
        this.removeSelection();
    }

    fillSelection = (char, fg, bg) => {
        const { selection, selectionEnd, selectedLayer } = this.props;
        const cpixs = [];

        const minX = Math.min(selection.x, selectionEnd.x);
        const maxX = Math.max(selection.x, selectionEnd.x);
        const minY = Math.min(selection.y, selectionEnd.y);
        const maxY = Math.max(selection.y, selectionEnd.y);

        const hSize = (maxX - minX) + 1;
        const vSize = (maxY - minY) + 1;
        for (let i = 0; i < vSize; i++) {
            cpixs.push([]);
            for (let ii = 0; ii < hSize; ii++) {
                cpixs[i].push([char, fg, bg]);
            }
        }
        this.props.draw(cpixs, minX, minY, selectedLayer);
        this.props.canvasUiUpdate({
            selection: null, selectionEnd: null
        });
    }

    completeFill = () => {
        const [char, fg, bg] = this.getDrawCandidateCpix();
        this.fillSelection(char, fg, bg);
    }

    charFill = () => {
        const [char, fg, bg] = this.getDrawCandidateCpix();
        this.fillSelection(char, fg, undefined);
    }

    backgroundFill = () => {
        const [char, fg, bg] = this.getDrawCandidateCpix();
        this.fillSelection(undefined, undefined, bg);
    }

    pasteClipboard = () => {
        const { clipboard, selectedLayer, selection } = this.props;
        if (clipboard && selection) {
            this.props.drawRefs(clipboard, selection.x, selection.y, selectedLayer);
        }
    }

    selectionToBrush = () => {
        const selectionData = this.retrieveSelectionData();
        this.props.addBrush(selectionData);
        toaster.show({
            message: "Selection added to brushes",
            intent: Intent.PRIMARY,
            timeout: 2000
        });
        this.props.canvasUiUpdate({
            selection: null, selectionEnd: null
        });
    }

    cancelSelection = () => {
        const { selection, selectionToMove } = this.props;
        if (selectionToMove) {
            this.props.canvasUiUpdate({ selectionToMove: null, previewOffset: null });
        } else if (selection) {
            this.props.canvasUiUpdate({ selection: null, selectionEnd: null });
        }
    }

    isCursorInsideSelection = () => {
        const { mouseX, mouseY } = this.state;
        const { mode, selection, selectionEnd, selectionToMove } = this.props;

        if (mode === "select" && selection) {
            const inXAxis = mouseX >= Math.min(selection.x, selectionEnd.x)
                && mouseX <= Math.max(selection.x, selectionEnd.x);
            const inYAxis = mouseY >= Math.min(selection.y, selectionEnd.y)
                && mouseY <= Math.max(selection.y, selectionEnd.y);

            if (inXAxis && inYAxis && !selectionToMove) {
                return true;
            }
        }
        return false;
    }

    randomizeSelection = () => {
        const { selectedLayer, selection, selectionEnd } = this.props;
        const xPos = Math.min(selection.x, selectionEnd.x);
        const yPos = Math.min(selection.y, selectionEnd.y);

        let selectionData = this.retrieveSelectionData();
        selectionData = randomize2dArray(selectionData);
        this.props.drawRefs(selectionData, xPos, yPos, selectedLayer);
    }

    flipSelectionVertically = () => {
        const { selectedLayer, selection, selectionEnd } = this.props;
        const xPos = Math.min(selection.x, selectionEnd.x);
        const yPos = Math.min(selection.y, selectionEnd.y);

        let selectionData = this.retrieveSelectionData();
        selectionData = flip2dArrayVertically(selectionData);
        this.props.drawRefs(selectionData, xPos, yPos, selectedLayer);
    }

    flipSelectionHorizontally = () => {
        const { selectedLayer, selection, selectionEnd } = this.props;
        const xPos = Math.min(selection.x, selectionEnd.x);
        const yPos = Math.min(selection.y, selectionEnd.y);

        let selectionData = this.retrieveSelectionData();
        selectionData = flip2dArrayHorizontally(selectionData);
        this.props.drawRefs(selectionData, xPos, yPos, selectedLayer);
    }

    drawBrush = () => {
        const { mouseX, mouseY } = this.state;
        const {
            selectedBrush, brushes, selectedLayer, previewOffset, ctrlDown, randomizeBrush, flipBrushHorizontally, flipBrushVertically } = this.props;
        const xPos = mouseX - (previewOffset?.x ?? 0);
        const yPos = mouseY - (previewOffset?.y ?? 0);

        let brush = brushes[selectedBrush];
        if (flipBrushVertically) brush = flip2dArrayVertically(brush);
        if (flipBrushHorizontally) brush = flip2dArrayHorizontally(brush);
        if (ctrlDown || randomizeBrush) brush = randomize2dArray(brush);

        this.props.drawRefs(brush, xPos, yPos, selectedLayer);
    }


    /* -------------------------------------------------------------------------- */
    /*                                  RENDERING                                 */
    /* -------------------------------------------------------------------------- */

    shouldComponentUpdate(nextProps, nextState) {
        // return true;
        if (nextState !== this.state) return true;
        else return compareProps([
            // canvas ui
            "mode", "selection", "selectionEnd", "textStartColumn", "textModeFont", "clipboard", "selectionToMove",
            "selectedBrush", "previewOffset", "flipBrushHorizontally", "flipBrushVertically", "randomizeBrush",
            // layer 
            "cpc", "resolution", "text_weight", "text_margin",
            // document
            "ppb", "hblocks", "vblocks", "char_palette", "color_palette", "fonts", "brushes",
            // char panel
            "selectedCharTab", "selectedPaletteChar", "selectedBrowserChar",
            // color panel
            "selectedColorTab", "selectedBrowserColor", "selectedFgColor", "selectedBgColor",
            // other
            "options", "altDown", "ctrlDown", "shiftDown",
        ], nextProps, this.props);
    }

    render() {
        const className = this.isCursorInsideSelection() ? "jq-move-cursor" : undefined;

        return (
            <canvas
                ref={this.layerRef}
                onMouseMove={this.handleMouseMove}
                onMouseDown={this.handleMouseDown}
                onMouseUp={this.handleMouseUp}
                onContextMenu={this.handleRightClick}
                onWheel={this.handleWheel}
                // onMouseOver={e => console.log("over")}
                width={this.props.width}
                height={this.props.height}
                className={className}
                style={{ zIndex: 101, position: "absolute" }}
            />
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    return {
        mode: state.canvasUi.mode,
        selection: state.canvasUi.selection,
        selectionEnd: state.canvasUi.selectionEnd,
        textStartColumn: state.canvasUi.textStartColumn,
        textModeFont: state.canvasUi.textModeFont,
        clipboard: state.canvasUi.clipboard,
        selectionToMove: state.canvasUi.selectionToMove,
        previewOffset: state.canvasUi.previewOffset,
        // brushes
        flipBrushHorizontally: state.brushes.flipBrushHorizontally,
        flipBrushVertically: state.brushes.flipBrushVertically,
        randomizeBrush: state.brushes.randomizeBrush,
        selectedBrush: state.document.brushes[state.brushes.selectedBrush] ? state.brushes.selectedBrush : null,
        // layer specific
        index: state.document.layers[ownProps.selectedLayer].index,
        grid: state.document.layers[ownProps.selectedLayer].grid,
        cpc: state.document.layers[ownProps.selectedLayer].cpc,
        resolution: state.document.layers[ownProps.selectedLayer].resolution,
        text_weight: state.document.layers[ownProps.selectedLayer].text_weight,
        text_margin: state.document.layers[ownProps.selectedLayer].text_margin,
        // document
        ppb: state.document.ppb,
        hblocks: state.document.hblocks,
        vblocks: state.document.vblocks,
        char_palette: state.document.palette.char,
        color_palette: state.document.palette.color,
        fonts: state.document.fonts,
        brushes: state.document.brushes,
        // char panel
        selectedCharTab: state.charPanel.selectedTab,
        selectedPaletteChar: state.charPanel.charPaletteSelection,
        selectedBrowserChar: state.charPanel.charBrowserSelection,
        // color panel
        selectedColorTab: state.colorPanel.selectedTab,
        selectedBrowserColor: state.colorPanel.colorBrowserSelection,
        selectedFgColor: state.colorPanel.fgSelection,
        selectedBgColor: state.colorPanel.bgSelection,
        // options
        options: state.options,

        altDown: state.ui.altDown,
        ctrlDown: state.ui.ctrlDown,
        shiftDown: state.ui.shiftDown,
    }
};

const mapDispatchToProps = {
    canvasUiUpdate,
    changeMode,
    draw,
    drawSingle,
    drawRefs,
    erase,
    eraseSingle,
    charPanelUpdate,
    colorPanelUpdate,
    addBrush,
    brushesUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(CanvasUI);
