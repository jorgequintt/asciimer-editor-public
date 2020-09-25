const initialState = {
    selectedBrush: null, // index
    flipBrushHorizontally: false, // bool
    flipBrushVertically: false, // bool
    randomizeBrush: false, // bool
}

export default function (state = initialState, action) {
    switch (action.type) {
        case "UPDATE_BRUSHES": {
            return { ...state, ...action.payload }
        }

        default:
            return state;
    }
}