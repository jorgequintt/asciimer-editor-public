const initialState = {
    mode: "draw", // draw, text, paint, selection, brush, erase
    clipboard: null, // cpixs object
    selection: null, // x and y object
    selectionEnd: null, // x and y object
    textStartColumn: null, // x coordinate
    textModeFont: 0, // index
    selectionToMove: null, // cpixs object
    previewOffset: null, // x and y object
}

export default function (state = initialState, action) {
    switch (action.type) {
        case "UPDATE_CANVAS_UI": {
            return { ...state, ...action.payload }
        }

        default:
            return state;
    }
}