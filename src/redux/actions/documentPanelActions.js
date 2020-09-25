export const update = (payload) => (dispatch) => {
    dispatch({ type: "UPDATE_DOCUMENT_PANEL", payload })
}

export const selectLayer = (id) => (dispatch) => {
    dispatch({ type: "UPDATE_DOCUMENT_PANEL", payload: { selectedLayer: id } })
    dispatch({
        type: "UPDATE_CANVAS_UI", payload: {
            selection: null, selectionEnd: null, textStartColumn: null, previewOffset: null, selectionToMove: null
        }
    })
}