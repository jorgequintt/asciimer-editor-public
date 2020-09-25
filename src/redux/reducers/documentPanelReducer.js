const initialState = {
    fontInspect: null,
    fontPreview: null,
    fontRemoveRequest: null,
    selectedLayer: null, // string, layer id
    selectedTab: "doc_properties",
}

export default function (state = initialState, action) {
    switch (action.type) {
        case "UPDATE_DOCUMENT_PANEL": {
            return { ...state, ...action.payload }
        }

        default:
            return state;
    }
}