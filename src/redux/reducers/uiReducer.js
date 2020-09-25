const initialState = {
    altDown: false,
    ctrlDown: false,
    shiftDown: false,
    helpOpen: true,
}

export default function (state = initialState, action) {
    switch (action.type) {
        case "UPDATE_UI": {
            return { ...state, ...action.payload }
        }

        default:
            return state;
    }
}