import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import thunk from "redux-thunk";

import documentReducer from "./reducers/documentReducer";
import uiReducer from "./reducers/uiReducer";
import documentPanelReducer from "./reducers/documentPanelReducer";
import charPanelReducer from "./reducers/charPanelReducer";
import colorPanelReducer from "./reducers/colorPanelReducer";
import canvasUiReducer from "./reducers/canvasUiReducer";
import optionsReducer from "./reducers/optionsReducer";
import brushesReducer from "./reducers/brushesReducer";

const reducers = combineReducers({
    document: documentReducer,
    ui: uiReducer,
    documentPanel: documentPanelReducer,
    charPanel: charPanelReducer,
    colorPanel: colorPanelReducer,
    canvasUi: canvasUiReducer,
    options: optionsReducer,
    brushes: brushesReducer,
});

const middleware = [thunk];

let devTools = window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__();
if (!devTools || process.env.NODE_ENV === "production") {
    // If prod, we set devTools as a function that returns the passed composed function made by compose()
    devTools = (passedComposedFunction) => {
        return passedComposedFunction;
    };
}

const initialState = {};
const store = createStore(reducers, initialState, compose(applyMiddleware(...middleware), devTools));

export default store;
