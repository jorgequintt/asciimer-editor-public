const initialState = {
    showGrid: false,
    isolateSelectedLayer: false,
    bringSelectedLayerToFront: false,
    grayOutUnfocusedLayers: false,
    noColorSetForBrowserCounterpart: true
}

export default function (state = initialState, action) {
    switch (action.type) {
        case "UPDATE_OPTIONS": {
            return { ...state, ...action.payload }
        }

        default:
            return state;
    }
}