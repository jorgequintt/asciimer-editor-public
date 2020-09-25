import { v4 as uuid } from "uuid";
import { cpixIntToValues, intToValues, valuesToInt } from "../../util/functions";
import _ from "lodash";

const initialState = {
    name: "",
    layers: {}, // object with layers
    palette: {
        char: [], // array of char values (font + unicode)
        color: [], // array of strings (hex colors)
    },
    hblocks: undefined, // int
    vblocks: undefined, // int
    ppb: undefined, // int, pixels per block
    fonts: [], // array of strings
    brushes: [], // array of 2d arrays (brushes data)
    created: false, // bool
    changed: false, // bool
};

function reducer(state, action) {
    const generateGrid = (properties) => {
        const grid_height = state.vblocks * properties.resolution;
        const grid_width = state.hblocks * properties.cpc * properties.resolution;

        const grid = [];

        for (let i = 0; i < grid_height; i++) {
            grid[i] = new Uint32Array(grid_width);
        }

        return grid;
    };

    switch (action.type) {
        /* -------------------------------------------------------------------------- */
        /*                                  DOCUMENT                                  */
        /* -------------------------------------------------------------------------- */

        case "CREATE_DOCUMENT": {
            const charPalette = new Array(1024).fill(undefined);
            charPalette[0] = null;

            const colorPalette = new Array(256).fill(undefined);
            colorPalette[0] = null;
            colorPalette[1] = "#ffffff";
            colorPalette[2] = "#000000";

            const defaultProperties = {
                ppb: 128,
                hblocks: 3,
                vblocks: 3,
                fonts: [null]
            };


            return {
                ...state,
                palette: {
                    char: charPalette,
                    color: colorPalette,
                },
                ...defaultProperties,
                ...action.payload,
                created: true,
                changed: true,
            };
            break;
        }

        case "LOAD_DOCUMENT": {
            return { ...action.payload };
        }

        case "UPDATE_DOCUMENT": {
            const properties = action.payload;

            const newLayers = { ...state.layers };
            if (properties.hblocks || properties.vblocks) {
                const layerIds = Object.keys(state.layers);
                layerIds.forEach((id) => {

                    const grid_height =
                        (properties.vblocks ?? state.vblocks) * state.layers[id].resolution;
                    const grid_width =
                        (properties.hblocks ?? state.hblocks) * state.layers[id].cpc * state.layers[id].resolution;

                    const grid = [];

                    for (let i = 0; i < grid_height; i++) {
                        grid[i] = new Uint32Array(grid_width);
                    }
                    for (let y = 0; y < grid.length; y++) {
                        for (let x = 0; x < grid[0].length; x++) {
                            const oldGridPix = state.layers[id].grid[y]?.[x];
                            if (oldGridPix !== undefined) grid[y][x] = oldGridPix;
                        }
                    }

                    newLayers[id] = { ...state.layers[id], grid };
                });
            }

            return {
                ...state,
                ...properties,
                layers: newLayers,
                changed: true,
            };
            break;
        }

        case "ADD_FONT": {
            const fontName = action.payload;
            return {
                ...state,
                fonts: [...state.fonts, fontName],
            };
        }

        case "REMOVE_FONT": {
            const fontName = action.payload;
            const fontIndex = state.fonts.indexOf(fontName);

            const modifiedLayers = {};

            const layerIds = Object.keys(state.layers);
            layerIds.forEach((id) => {
                const grid = [...state.layers[id].grid];
                for (let y = 0; y < grid.length; y++) {
                    let rowUpdated = false;

                    const updateRow = () => {
                        if (rowUpdated) return;
                        grid[y] = new Uint32Array(grid[y]);
                        rowUpdated = true;
                    };

                    for (let x = 0; x < grid[0].length; x++) {
                        const values = intToValues(grid[y][x]);

                        const char = state.palette.char[values[0]];
                        const [charFontIndex, charUnicode] = cpixIntToValues(char);
                        if (fontIndex === charFontIndex) {
                            updateRow();
                            grid[y][x] = valuesToInt(0, 0, values[2]);
                        }

                    }
                }
                modifiedLayers[id] = { ...state.layers[id], grid };
            });

            const newBrushes = state.brushes.map((brush) => {
                for (let y = 0; y < brush.length; y++) {
                    for (let x = 0; x < brush[0].length; x++) {
                        const values = intToValues(brush[y][x]);

                        const char = state.palette.char[values[0]];
                        const [charFontIndex, charUnicode] = cpixIntToValues(char);
                        if (fontIndex === charFontIndex) {
                            brush[y][x] = valuesToInt(0, 0, values[2]);
                        }
                    }
                }
                return brush;
            });

            // clean palette
            const newCharPalette = [...state.palette.char];
            for (let i = 0; i < newCharPalette.length; i++) {
                const char = newCharPalette[i];
                const [charFontIndex, charUnicode] = cpixIntToValues(char);
                if (fontIndex === charFontIndex) newCharPalette[i] = undefined;
            }

            const newFonts = [...state.fonts];
            for (let i = 0; i < newFonts.length; i++) {
                const font = newFonts[i];
                if (font === fontName) newFonts[i] = undefined;
            }

            return {
                ...state,
                layers: modifiedLayers,
                brushes: newBrushes,
                palette: { color: state.palette.color, char: newCharPalette },
                fonts: newFonts,
            };
        }

        /* -------------------------------------------------------------------------- */
        /*                                   LAYERS                                   */
        /* -------------------------------------------------------------------------- */

        case "CREATE_LAYER": {
            // defaults
            let properties = {
                resolution: 8,
                cpc: 1,
            };

            if (!!action.payload?.resolution && !!action.payload?.cpc) {
                properties = { ...action.payload };
            }

            const layersLength = Object.keys(state.layers).length;
            const grid = generateGrid(properties);
            const newLayer = {
                grid,
                visible: true,
                index: layersLength,
                text_margin: 0,
                text_weight: 400,
                type: "text",
                name: `Layer #${layersLength}`,
                ...properties,
            };

            return {
                ...state,
                layers: { ...state.layers, [uuid()]: newLayer },
                changed: true,
            };
            break;
        }

        case "DUPLICATE_LAYER": {
            const duplicatedLayer = _.cloneDeep(state.layers[action.payload]);
            duplicatedLayer.index++;
            duplicatedLayer.name = `Duplicated ${duplicatedLayer.name}`;

            const layerIds = Object.keys(state.layers);
            const modifiedLayers = {};
            layerIds.forEach((id) => {
                if (state.layers[id].index >= duplicatedLayer.index) {
                    modifiedLayers[id] = { ...state.layers[id], index: state.layers[id].index + 1 };
                }
            });

            return {
                ...state,
                layers: { ...state.layers, ...modifiedLayers, [uuid()]: duplicatedLayer },
                changed: true,
            };
            break;
        }


        case "MOVE_LAYER": {
            const { layerId, index: targetIndex } = action.payload;
            const previousIndex = state.layers[layerId].index;
            if (previousIndex === targetIndex) return state;

            const newLayerStack = { ...state.layers };
            newLayerStack[layerId] = { ...newLayerStack[layerId], index: targetIndex };

            const layerIds = Object.keys(newLayerStack);
            if (previousIndex > targetIndex) {
                // if layer went up
                layerIds.forEach((id) => {
                    if (id !== layerId && newLayerStack[id].index >= targetIndex && newLayerStack[id].index < previousIndex)
                        newLayerStack[id] = { ...newLayerStack[id], index: newLayerStack[id].index + 1 };
                });
            } else {
                // if layer went down
                layerIds.forEach((id) => {
                    if (id !== layerId && newLayerStack[id].index <= targetIndex && newLayerStack[id].index > previousIndex)
                        newLayerStack[id] = { ...newLayerStack[id], index: newLayerStack[id].index - 1 };
                });
            }

            return {
                ...state,
                layers: newLayerStack,
                changed: true,
            };
        }


        case "DELETE_LAYER": {
            const id = action.payload;
            const deletedIndex = state.layers[id].index;
            const layerIds = Object.keys(state.layers);

            const newLayerStack = { ...state.layers };
            layerIds.forEach((id) => {
                if (newLayerStack[id].index > deletedIndex)
                    newLayerStack[id] = { ...newLayerStack[id], index: newLayerStack[id].index - 1 };
            });

            delete newLayerStack[id];
            return {
                ...state,
                layers: newLayerStack,
                changed: true,
            };
        }

        case "UPDATE_LAYER": {
            const { layerId: id, properties } = action.payload;
            const newLayer = { ...state.layers[id], ...properties };

            // generate and update new grid if needed
            if (properties.cpc || properties.resolution) {
                const newGrid = generateGrid(newLayer);
                for (let y = 0; y < newGrid.length; y++) {
                    for (let x = 0; x < newGrid[0].length; x++) {
                        const oldGridPix = state.layers[id].grid[y]?.[x];
                        if (oldGridPix !== undefined) newGrid[y][x] = oldGridPix;
                    }
                }
                newLayer.grid = newGrid;
            }

            // state.layers[id] = newLayer;
            return {
                ...state,
                layers: { ...state.layers, [id]: newLayer },
                changed: true,
            };
        }

        case "UPDATE_PALETTE": {
            const { palette, index, value } = action.payload;
            const modifiedPalettes = { ...state.palette };
            const modifiedLayers = { ...state.layers };

            if (index === 0) return state; // we won't allow changing the first index

            // Erase references on cpixs if null is passed
            if (value !== null) {
                // If not null
                if (index) {
                    modifiedPalettes[palette] = [...modifiedPalettes[palette]];
                    modifiedPalettes[palette][index] = value;
                } else {
                    // value doesnt' exist, we add it to palette
                    const valIndexInPalette = state.palette[palette].indexOf(value);
                    if (valIndexInPalette === -1) {
                        // If value don't exist
                        modifiedPalettes[palette] = [...modifiedPalettes[palette]];
                        const firstNewEmpty = modifiedPalettes[palette].indexOf(undefined);
                        modifiedPalettes[palette][firstNewEmpty] = value;
                    }
                }
            } else {
                // If null (to delete palette value)
                modifiedPalettes[palette] = [...modifiedPalettes[palette]];
                modifiedPalettes[palette][index] = undefined; // free space

                const layerIds = Object.keys(state.layers);
                layerIds.forEach((id) => {
                    const grid = [...state.layers[id].grid];
                    for (let y = 0; y < grid.length; y++) {
                        let rowUpdated = false;

                        const updateRow = () => {
                            if (rowUpdated) return;
                            grid[y] = new Uint32Array(grid[y]); // new row
                            rowUpdated = true;
                        };

                        for (let x = 0; x < grid[0].length; x++) {
                            let values = intToValues(grid[y][x]);
                            let changed = false;

                            if (palette === "char") {
                                if (values[0] === index) {
                                    values[0] = 0;
                                    values[1] = 0;
                                    changed = true;
                                }
                            } else if (palette === "color") {
                                if (values[1] === index) (values[1] = 0), (values[0] = 0), (changed = true);
                                if (values[2] === index) (values[2] = 0), (changed = true);
                            }

                            if (changed) {
                                updateRow();
                                grid[y][x] = valuesToInt(values[0], values[1], values[2]);
                            }
                        }
                    }
                    modifiedLayers[id] = { ...modifiedLayers[id], grid };
                    // state.layers[id].grid = grid;
                });
            }

            return {
                ...state,
                palette: modifiedPalettes,
                layers: modifiedLayers,
                changed: true,
            };
        }


        case "UPDATE_CPIX_REFS":
        case "UPDATE_CPIX": {
            const { cpixs, xStart, yStart, layerId } = action.payload;
            const grid = [...state.layers[layerId].grid];

            const newPalette = { ...state.palette };
            for (let y = 0; y < cpixs.length; y++) {
                if (yStart + y > grid.length - 1) continue;
                grid[yStart + y] = new Uint32Array(grid[yStart + y]); // new row
                for (let x = 0; x < cpixs[0].length; x++) {
                    if (xStart + x > grid[0].length - 1) continue;

                    const values = intToValues(grid[yStart + y][xStart + x]);
                    if (action.type === "UPDATE_CPIX") {
                        const [char, fg, bg] = cpixs[y][x];

                        let charIndex = char === undefined ? values[0] : newPalette.char.indexOf(char);
                        if (charIndex === -1) {
                            newPalette.char = [...newPalette.char];
                            charIndex = newPalette.char.indexOf(undefined);
                            newPalette.char[charIndex] = char;
                        }

                        let fgIndex = fg === undefined ? values[1] : newPalette.color.indexOf(fg);
                        if (fgIndex === -1) {
                            newPalette.color = [...newPalette.color];
                            fgIndex = newPalette.color.indexOf(undefined);
                            newPalette.color[fgIndex] = fg;
                        }

                        // we don't set char or fg if only one of them is given
                        if (charIndex === 0 || fgIndex === 0) charIndex = 0, fgIndex = 0;

                        let bgIndex = bg === undefined ? values[2] : newPalette.color.indexOf(bg);
                        if (bgIndex === -1) {
                            newPalette.color = [...newPalette.color];
                            bgIndex = newPalette.color.indexOf(undefined);
                            newPalette.color[bgIndex] = bg;
                        }

                        grid[yStart + y][xStart + x] = valuesToInt(charIndex, fgIndex, bgIndex);
                    } else {
                        const [char, fg, bg] = intToValues(cpixs[y][x]);

                        let charIndex = char === undefined ? values[0] : char;
                        let fgIndex = fg === undefined ? values[1] : fg;
                        let bgIndex = bg === undefined ? values[2] : bg;

                        // we don't set char or fg if only one of them is given
                        if (charIndex === 0 || fgIndex === 0) charIndex = 0, fgIndex = 0;

                        grid[yStart + y][xStart + x] = valuesToInt(charIndex, fgIndex, bgIndex);
                    }
                }
            }

            return {
                ...state,
                palette: newPalette,
                layers: { ...state.layers, [layerId]: { ...state.layers[layerId], grid } },
                changed: true,
            };
        }


        case "REMOVE_BRUSH": {
            return {
                ...state,
                brushes: state.brushes.filter((brush, index) => action.payload !== index)
            }
        }

        case "ADD_BRUSH": {
            return {
                ...state,
                brushes: [...state.brushes, action.payload]
            }
        }

        default: {
            return state;
        }
    }
}

// UNDO feature -- ducktaped custom reducer enhancer
const maxUndoHistory = 100;
const enhancedReducer = (state = initialState, action) => {
    if (window.undoHistory === undefined) {
        window.undoHistory = { past: [], future: [] };
    }

    if (action.type === "UNDO") {
        if (window.undoHistory.past.length === 0) return state;
        window.undoHistory.future.push({ ...state });
        const pastState = window.undoHistory.past.pop();
        return pastState;
    } else if (action.type === "REDO") {
        if (window.undoHistory.future.length === 0) return state;
        window.undoHistory.past.push({ ...state });
        const futureState = window.undoHistory.future.pop();
        return futureState;
    } else {
        const newState = reducer(state, action);
        if (state !== newState) {
            if (["CREATE_DOCUMENT", "LOAD_DOCUMENT"].includes(action.type)) {
                window.undoHistory = { past: [], future: [] };
            } else {
                window.undoHistory.future = [];
                if (window.undoHistory.past.length === maxUndoHistory) window.undoHistory.past.shift();
                window.undoHistory.past.push(state);
            }
        }
        return newState;
    }
}
export default enhancedReducer;