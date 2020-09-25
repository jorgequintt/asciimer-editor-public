export const update = (payload) => (dispatch) => {
    dispatch({ type: "UPDATE_UI", payload });
}