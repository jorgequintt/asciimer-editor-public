import React from "react";
import ReactDom from "react-dom";
import App from "./App";
import { b64 as font } from './tests/testFont';
import { cpixValuesToInt } from "./util/functions";

// Redux
import store from "./redux/store";
import { loadFont } from './redux/actions/documentActions';

ReactDom.render(<App store={store} />, document.querySelector("#container"));

// PUBLIC VERSION SETUP
(async () => {
    store.dispatch({
        type: "CREATE_DOCUMENT",
        payload: { name: "Test Asciimer Project", ppb: 256, hblocks: 2, vblocks: 2 },
    });

    store.dispatch({
        type: "CREATE_LAYER",
    });

    await store.dispatch(loadFont(font));

    const layers = Object.keys(store.getState().document.layers);
    store.dispatch({
        type: "UPDATE_DOCUMENT_PANEL",
        payload: { selectedLayer: layers[0] }
    });

    store.dispatch({
        type: "UPDATE_CHAR_PANEL",
        payload: { charPaletteSelection: 2 }
    });
    store.dispatch({
        type: "UPDATE_COLOR_PANEL",
        payload: { fgSelection: 1 }
    });

    store.dispatch({
        type: "UPDATE_CPIX", payload: {
            cpixs: [
                [[cpixValuesToInt(1, 4), undefined, undefined], [cpixValuesToInt(1, 5), undefined, undefined], [cpixValuesToInt(1, 6), undefined, undefined], [cpixValuesToInt(1, 3), undefined, undefined], [cpixValuesToInt(1, 2), undefined, undefined]]
            ],
            xStart: 0,
            yStart: 0,
            layerId: layers[0]
        }
    })
})();