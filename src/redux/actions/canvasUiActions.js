export const update = (payload) => (dispatch) => {
    dispatch({ type: "UPDATE_CANVAS_UI", payload })
}

export const changeMode = (mode) => (dispatch) => {
    dispatch({
        type: "UPDATE_CANVAS_UI", payload: {
            mode,
            selection: null,
            selectionEnd: null,
            textStartColumn: null,
            selectionToMove: null,
            previewOffset: null,
        }
    })
}