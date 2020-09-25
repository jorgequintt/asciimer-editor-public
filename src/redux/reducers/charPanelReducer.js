const initialState = {
    charPaletteSelection: null, // index
    charBrowserSelection: null, // value (font + unicode)
    charForReplacement: null, // index
    charReplacement: null, // value (font + unicode)
    selectedTab: "char_palette" // string, tab id
};

export default function (state = initialState, action) {
    switch (action.type) {
        case "UPDATE_CHAR_PANEL": {
            return { ...state, ...action.payload }
        }

        default:
            return state;
    }
}