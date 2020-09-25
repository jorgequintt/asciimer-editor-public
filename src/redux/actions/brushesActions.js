export const update = (payload) => (dispatch) => {
    dispatch({ type: "UPDATE_BRUSHES", payload })
}

export const removeBrush = (index) => (dispatch) => {
    dispatch({ type: "REMOVE_BRUSH", payload: index })
}

export const addBrush = (brush) => (dispatch) => {
    dispatch({ type: "ADD_BRUSH", payload: brush })
}