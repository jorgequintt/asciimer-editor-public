import { Intent } from "@blueprintjs/core";
import * as fontParser from "../../util/fontParser";
import { arrayBufferToBase64, cpixIntToValues, intToValues, downloadFile, base64ToArrayBuffer } from "../../util/functions";
import { mainToaster, toaster } from "../../util/toaster";

export const createDocument = () => (dispatch) => {
    dispatch({ type: "CREATE_DOCUMENT" });
    dispatch({ type: "CREATE_LAYER" });
}

// Fonts
export const loadFont = (font_data) => async (dispatch) => {
    const font_obj = await fontParser.loadFont(font_data);
    dispatch({ type: "ADD_FONT", payload: font_obj.name }); // track on document
};

export const saveFont = (fontName) => (dispatch) => {
    dispatch({ type: "ADD_FONT", payload: fontName }); // track on document
};

export const removeFont = (fontName) => async (dispatch) => {
    fontParser.removeFont(fontName);
    dispatch({ type: "REMOVE_FONT", payload: fontName });
};

// Documento
export const update = (payload) => (dispatch) => {
    dispatch({ type: "UPDATE_DOCUMENT", payload });
};

// export const update = (property) => (dispatch, getState) => {
//     dispatch({ type: "UPDATE_DOCUMENT", payload });

// };

export const addColorToPalette = (color) => (dispatch) => {
    dispatch({
        type: "UPDATE_PALETTE",
        payload: {
            palette: "color",
            value: color,
        },
    });
};

export const replaceColorFromPalette = (index, newColor) => (dispatch) => {
    dispatch({
        type: "UPDATE_PALETTE",
        payload: {
            palette: "color",
            index,
            value: newColor,
        },
    });
};

export const removeColorFromPalette = (index) => (dispatch) => {
    dispatch({
        type: "UPDATE_PALETTE",
        payload: {
            palette: "color",
            index: index,
            value: null,
        },
    });
};

export const addCharToPalette = (char) => (dispatch) => {
    dispatch({
        type: "UPDATE_PALETTE",
        payload: {
            palette: "char",
            value: char,
        },
    });
};

export const removeCharFromPalette = (index) => (dispatch) => {
    dispatch({
        type: "UPDATE_PALETTE",
        payload: {
            palette: "char",
            index: index,
            value: null,
        },
    });
};

export const replaceCharFromPalette = (index, newChar) => (dispatch) => {
    dispatch({
        type: "UPDATE_PALETTE",
        payload: {
            palette: "char",
            index,
            value: newChar,
        },
    });
};

// Layers 
export const createLayer = () => (dispatch) => {
    dispatch({
        type: "CREATE_LAYER",
    });
};

export const updateLayer = (layerId, properties) => (dispatch) => {
    dispatch({
        type: "UPDATE_LAYER",
        payload: {
            layerId,
            properties,
        },
    });
};

export const moveLayer = (layerId, index) => (dispatch) => {
    dispatch({
        type: "MOVE_LAYER",
        payload: {
            layerId,
            index,
        },
    });
};

export const duplicateLayer = (layerId) => (dispatch) => {
    dispatch({
        type: "DUPLICATE_LAYER",
        payload: layerId,
    });
};

export const deleteLayer = (layerId) => (dispatch) => {
    dispatch({
        type: "DELETE_LAYER",
        payload: layerId,
    });
};

// Drawing
export const draw = (cpixs, xStart, yStart, layerId) => (dispatch) => {
    dispatch({
        type: "UPDATE_CPIX", payload: {
            cpixs, xStart, yStart, layerId
        }
    })
}
export const drawRefs = (cpixs, xStart, yStart, layerId) => (dispatch) => {

    dispatch({
        type: "UPDATE_CPIX_REFS", payload: {
            cpixs, xStart, yStart, layerId
        }
    })
}

export const drawSingle = (cpix, xStart, yStart, layerId) => (dispatch) => {
    dispatch({
        type: "UPDATE_CPIX", payload: {
            cpixs: [[cpix]], xStart, yStart, layerId
        }
    })

}

export const eraseSingle = (xStart, yStart, layerId) => (dispatch) => {
    dispatch({
        type: "UPDATE_CPIX", payload: {
            cpixs: [[[null, null, null]]], xStart, yStart, layerId
        }
    });
}

export const erase = (xStart, yStart, xEnd, yEnd, layerId) => (dispatch) => {
    const emptyCpixs = [];
    const hSize = (Math.max(xStart, xEnd) - Math.min(xStart, xEnd)) + 1;
    const vSize = (Math.max(yStart, yEnd) - Math.min(yStart, yEnd)) + 1;
    for (let i = 0; i < vSize; i++) {
        emptyCpixs.push([]);
        for (let ii = 0; ii < hSize; ii++) {
            emptyCpixs[i].push([null, null, null]);
        }
    }
    dispatch({
        type: "UPDATE_CPIX", payload: {
            cpixs: emptyCpixs, xStart: Math.min(xStart, xEnd), yStart: Math.min(yStart, yEnd), layerId
        }
    });
}

export const undo = () => (dispatch) => {
    dispatch({ type: "UNDO" });
}

export const redo = () => (dispatch) => {
    dispatch({ type: "REDO" });
}

export const exportDocument = () => (dispatch, getState) => {
    mainToaster.show({ message: "Exporting...", intent: Intent.PRIMARY, timeout: 3000 });
    const { hblocks, vblocks, ppb, name, layers, palette: { char: char_palette, color: color_palette }, fonts } = getState().document;

    const canvas = document.createElement("canvas");
    canvas.width = hblocks * ppb;
    canvas.height = vblocks * ppb;
    const ctx = canvas.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const layersDataOrdered = Object.values(layers).sort((a, b) => b.index - a.index);
    layersDataOrdered.forEach((layer) => {
        const { resolution, cpc, text_margin, text_weight } = layer;
        const char_height = (ppb / resolution);
        const char_width = (ppb / resolution) / cpc;
        const fontSize = char_height - text_margin;

        const drawCpix = (cpix, x, y) => {
            const values = intToValues(cpix);
            const char = char_palette[values[0]];
            const fgColor = color_palette[values[1]];
            const bgColor = color_palette[values[2]];

            const visibleChar = char && fgColor;
            if (!visibleChar && !bgColor) return; // if cpix has no visibility, we skip

            // Draw background
            if (bgColor) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(
                    x * char_width, y * char_height,
                    char_width, char_height
                );
            }

            // Draw text
            if (visibleChar) {
                const [fontIndex, charUnicode] = cpixIntToValues(char);
                const fontName = fonts[fontIndex];
                ctx.font = `${text_weight} ${fontSize}px "${fontName}", "Adobe Blank"`;

                ctx.fillStyle = fgColor;

                const center_x = (x * char_width) + (char_width / 2);
                const center_y = (y * char_height) + (char_height / 2);
                ctx.fillText(String.fromCharCode(charUnicode), center_x, center_y);
            }
        } // end inner func

        for (let y = 0; y < layer.grid.length; y++) {
            for (let x = 0; x < layer.grid[0].length; x++) {
                drawCpix(layer.grid[y][x], x, y);
            }
        }
    });

    canvas.toBlob((img_data) => {
        downloadFile(img_data, `${name ?? "Image"}.png`);
    }, 'image/png');
}

export const saveDocument = () => (dispatch, getState) => {
    const documentData = { ...getState().document };
    const fontsData = { ...window.fonts };
    Object.keys(fontsData).forEach(fontName => {
        fontsData[fontName].data = arrayBufferToBase64(fontsData[fontName].data);
    });
    documentData.fontsData = fontsData;
    const json_data = JSON.stringify(documentData, (k, v) => v === undefined ? "$%&UNDEFINED$%&" : v);
    downloadFile(json_data, `${documentData.name ?? "Project"}.aep`, 'text/plain');
    toaster.show({ message: `File saved`, intent: Intent.SUCCESS, timeout: 1000 });
}

export const loadDocument = (data) => async (dispatch) => {
    const json = JSON.parse(data, (k, v) => v === "$%&UNDEFINED$%&" ? undefined : v);

    // load fonts
    const fontsData = json.fontsData;
    const fontNames = Object.keys(fontsData);
    window.fonts = {};
    for (let i = 0; i < fontNames.length; i++) {
        const fontName = fontNames[i];
        await fontParser.loadFont(fontsData[fontName].data);
    }
    delete json.fontsData;

    // transform grid rows into array buffers
    const layerIds = Object.keys(json.layers);
    layerIds.forEach((id) => {
        const grid = json.layers[id].grid;
        const uintGrid = [];
        // transform object with index into array. Sorted just in case
        grid[0] = Object.entries(grid[0]).sort((a, b) => a[0] - b[0]).map(r => r[1]);

        for (let y = 0; y < grid.length; y++) {
            uintGrid[y] = new Uint32Array(grid[0].length);
            for (let x = 0; x < grid[0].length; x++) {
                uintGrid[y][x] = grid[y][x];
            }
        }

        json.layers[id].grid = uintGrid;
    });

    dispatch({ type: "LOAD_DOCUMENT", payload: json });
    mainToaster.show({ message: `Project "${json.name}" loaded`, intent: Intent.SUCCESS, timeout: 2000 });
}