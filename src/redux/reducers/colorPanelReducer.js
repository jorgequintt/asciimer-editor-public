const initialState = {
    fgSelection: null, // index
    bgSelection: null, // index
    colorBrowserSelection: null, // string. hex color
    colorForReplacement: null, // index
    colorReplacement: null, // string, hex color
    selectedTab: "color_palette", // id, tab
};

export default function (state = initialState, action) {
    switch (action.type) {
        case "UPDATE_COLOR_PANEL": {
            return { ...state, ...action.payload }
        }

        default:
            return state;
    }
}