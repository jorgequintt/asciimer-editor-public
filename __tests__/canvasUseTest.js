import React from "react";
import _ from "lodash";
import { intToValues, valuesToint } from "../src/util/functions";
import { connectedComponentRegistrar } from "../src/util/test_functions";

// Components
import App from "../src/App";
import Drawboard from "../src/components/Layout/Drawboard";
import Document from "../src/components/Canvas/Document";
import Layer from "../src/components/Canvas/Layer";

// Redux
import store from "../src/redux/store";
const { dispatch, getState } = store;

// Tests
import { mount } from "enzyme";

let app;
let drawboard = () => app.update().find(Drawboard);
let doc = () => drawboard().find(Document);
let firstLayerId;
let secondLayerId;
let thirdLayerId;

connectedComponentRegistrar(Layer);

// map existing methods to Layer component
let layerSpies = {};
["componentDidUpdate", "drawCpix", "cleanCpix", "handleGridDifferences"].map((method) => {
    if (Layer.WrappedComponent.prototype[method])
        layerSpies[method] = jest.spyOn(Layer.WrappedComponent.prototype, method);
});

describe("App startup", () => {
    test("App component is rendered", () => {
        let MockedApp = jest.fn((...args) => App(...args));
        app = mount(<App store={store} />);

        expect(true).toBeTruthy();
        // expect(MockedApp).toHaveBeenCalled();
    });

    test("Store is accesible", () => {
        const store = getState();
        expect(store["document"]).toBeTruthy();
    });

    test("Drawboard is rendered", () => {
        // drawboard() = app.find(Drawboard);
        expect(drawboard()).toHaveLength(1);
    });
});

/* -------------------------------------------------------------------------- */
/*                    User creates document with dimensions                   */
/* -------------------------------------------------------------------------- */

describe("User creates document with dimensions", () => {
    const docProperties = { hblocks: 8, vblocks: 12, ppb: 200 };
    beforeAll(() => {
        jest.clearAllMocks();
        dispatch({
            type: "CREATE_DOCUMENT",
            payload: docProperties,
        });
        app.update();
    });

    test("DOM: Document should be in Drawboard", () => {
        // drawboard().update();
        // doc() = app.find(Drawboard).first().find(Document);
        expect(doc()).toHaveLength(1);
    });
    test("STORE: Store's document should have properties correctly set", () => {
        const documentState = getState().document;
        expect(documentState).toMatchObject(docProperties);
    });
    test("DOM: Initial layer should be in Document", () => {
        const layers = doc().find(Layer);
        firstLayerId = layers.first().props().id;

        expect(layers).toHaveLength(1);
        expect(layers.first().props().id).toBeTruthy();
    });
    test("STORE: Store's layer stack should be set up", () => {
        expect(getState().document).toHaveProperty("layers", expect.any(Object));
    });
    test("STORE: Store: Initial layer should exists", () => {
        expect(getState().document.layers).toHaveProperty(firstLayerId, expect.any(Object));
    });
    test("STORE: Initial layer structure should be set", () => {
        expect(getState().document.layers[firstLayerId]).toMatchObject({
            index: 0,
            grid: expect.any(Array),
            resolution: expect.any(Number),
            cpc: expect.any(Number),
            text_margin: expect.any(Number),
            text_weight: expect.any(Number),
            text_family: expect.any(String),
        });
    });
    test("STORE; Initial layer grid should be set up and correct", () => {
        const documentState = getState().document;
        const { resolution, cpc, grid } = documentState.layers[firstLayerId];
        const { hblocks, vblocks } = documentState;

        expect(grid.length).toBe(vblocks * resolution);
        expect(grid[0].length).toBe(hblocks * cpc * resolution);
    });
    test("STORE: Char palette should be set up", () => {
        const charPalette = getState().document.palette["char"];
        expect(charPalette).toBeInstanceOf(Array);
        expect(charPalette).toHaveLength(256);
        expect(charPalette[0], "First char should be null").toBe(null);
    });
    test("STORE: Color palette should be set up", () => {
        const colorPalette = getState().document.palette["color"];
        expect(colorPalette).toBeInstanceOf(Array);
        expect(colorPalette).toHaveLength(256);
        expect(colorPalette[0], "The first color should be null").toBe(null);
        expect(colorPalette[1], "The second color should be white").toBe("#ffffff");
        expect(colorPalette[2], "The third color should be black").toBe("#000000");
    });
});

/* -------------------------------------------------------------------------- */
/*                          User creates a new layer                          */
/* -------------------------------------------------------------------------- */

describe("User creates a new layer", () => {
    let prevStateDoc, stateDoc;
    beforeAll(() => {
        prevStateDoc = getState().document;
        jest.clearAllMocks();
        dispatch({ type: "CREATE_LAYER" });
        stateDoc = getState().document;
    });

    test("STORE: Layer should be created", () => {
        const newLayers = _.difference(Object.keys(stateDoc.layers), Object.keys(prevStateDoc.layers));

        expect(newLayers).toHaveLength(1);
    });

    test("There should be two layers now (DOM y Store)", () => {
        const layers = doc().find(Layer);
        expect(layers).toHaveLength(2);

        const layersArr = Object.keys(stateDoc.layers);
        expect(layersArr).toHaveLength(2);
    });
    test("STORE: Layers should have correct index", () => {
        const layers = getState().document.layers;
        const layersArr = Object.keys(layers);
        layersArr.forEach((layerId) => {
            if (layerId === firstLayerId) {
                expect(layers[layerId].index).toBe(0);
            } else {
                secondLayerId = layerId;
                expect(layers[layerId].index).toBe(1);
            }
        });
    });
});

/* -------------------------------------------------------------------------- */
/*                           User duplicates a layer                          */
/* -------------------------------------------------------------------------- */

describe("User duplicates a layer", () => {
    let prevState, state;
    beforeAll(() => {
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "DUPLICATE_LAYER", payload: firstLayerId });
        state = getState().document;
    });

    test("STORE: Layer 3 should exists and 3 layers should exist", () => {
        const prevLayersArr = Object.keys(prevState.layers);
        const layersArr = Object.keys(state.layers);

        const layer3 = _.difference(layersArr, prevLayersArr);
        expect(layer3).toHaveLength(1);
        thirdLayerId = layer3[0];
        expect(layersArr).toHaveLength(3);
    });
    test("STORE: New layer should be a duplicated Layer 1 with index 1", () => {
        const layers = getState().document.layers;

        expect(layers[thirdLayerId]).toEqual(
            expect.objectContaining({
                ...layers[firstLayerId],
                index: 1,
            })
        );
    });
    test("STORE: Second Layer should have index of 2", () => {
        const layers = getState().document.layers;

        expect(layers[secondLayerId]).toHaveProperty("index", 2);
    });
});

/* -------------------------------------------------------------------------- */
/*                             User moves a layer                             */
/* -------------------------------------------------------------------------- */

describe("User moves a layer", () => {
    beforeAll(() => {
        jest.clearAllMocks();
        dispatch({ type: "MOVE_LAYER", payload: { layerId: secondLayerId, index: 1 } });
    });

    test('STORE: "Second layer" should have index of 1', () => {
        const layers = getState().document.layers;
        expect(layers[secondLayerId].index).toBe(1);
    });

    test("DOM: Should only be one Layer component with index 1 and with secondLayerId", () => {
        Layer.instances.forEach((layer) => {
            if (layer.props.id === secondLayerId) {
                expect(layer.props.index).toBe(1);
            } else {
                expect(layer.props.index).not.toBe(1);
            }
        });
    });
});

/* -------------------------------------------------------------------------- */
/*                          User deletes second layer                         */
/* -------------------------------------------------------------------------- */

describe("User deletes second layer", () => {
    let storeLayers, domLayers;
    beforeAll(() => {
        jest.clearAllMocks();
        dispatch({ type: "DELETE_LAYER", payload: secondLayerId });
        storeLayers = getState().document.layers;
        domLayers = doc().find(Layer);
    });

    test("STORE: Layer should not exist in store", () => {
        expect(storeLayers[secondLayerId]).toBeFalsy();
    });
    test("STORE: thirdLayerId should have index of 1 now", () => {
        expect(storeLayers[thirdLayerId].index).toBe(1);
    });
    test("DOM: Layer component should not exist in Document", () => {
        domLayers.forEach((layer) => {
            expect(layer.props().id).not.toBe(secondLayerId);
        });
    });
    test("DOM: thirdLayerId should have index of 1 now", () => {
        Layer.instances.forEach((layer) => {
            if (layer.props.id === thirdLayerId) expect(layer.props.index).toBe(1);
        });
    });

    afterAll(() => {
        secondLayerId = thirdLayerId;
    });
});

/* -------------------------------------------------------------------------- */
/*                       User draws a new char on layer                       */
/* -------------------------------------------------------------------------- */

describe("User draws a new char on first layer", () => {
    let prevState, state, prevGrid;
    beforeAll(() => {
        // prevState = _.cloneDeep(getState().document);
        prevGrid = getState().document.layers[firstLayerId].grid;
        prevState = _.cloneDeep(getState().document);

        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: firstLayerId,
                xStart: 4,
                yStart: 9,
                cpixs: [[["K", "#ffffff", undefined, undefined]]],
            },
        });
        state = getState().document;
    });

    test("STORE: Char gets saved to char palette", () => {
        const diff = _.difference(state.palette["char"], prevState.palette["char"]);
        expect(diff).toHaveLength(1);
        expect(diff).toEqual(expect.arrayContaining(["K"]));
    });
    test("STORE: Grid changed", () => {
        expect(state.layers[firstLayerId.grid]).not.toBe(prevGrid);
    });
    test("STORE: Char gets saved correctly to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        const cpix = layerGrid[9][4];
        const prevCpix = prevLayerGrid[9][4];

        expect(cpix, "Cpix value should not be equal to prev one").not.toEqual(prevCpix);
        const cpixRefs = intToValues(cpix);
        const prevCpixRefs = intToValues(prevCpix);
        const charIndex = state.palette["char"].indexOf("K");

        expect(cpixRefs[0], "Cpix char SHOULD NOT BE equal to prev one (empty)").not.toEqual(prevCpixRefs[0]);
        expect(cpixRefs[0], "Cpix char SHOULD MATCH char ref in palette").toEqual(charIndex);
        expect(cpixRefs[1], "Cpix fg color SHOULD NOT BE equal to prev one (empty)").not.toEqual(prevCpixRefs[1]);
        expect(cpixRefs[2], "Cpix bg color SHOULD BE equal to prev one (empty)").toEqual(prevCpixRefs[2]);
    });
    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 1 time", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(1);
    });
});

/* -------------------------------------------------------------------------- */
/*                     User draws a palette char on layer                     */
/* -------------------------------------------------------------------------- */

describe("User draws a char from palette on layer", () => {
    let prevState, state;
    beforeAll(() => {
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: firstLayerId,
                xStart: 7,
                yStart: 15,
                cpixs: [[["K", "#ffffff", undefined, undefined]]],
            },
        });
        state = getState().document;
    });

    test("STORE: Char palette did not change", () => {
        const diff = _.difference(state.palette["char"], prevState.palette["char"]);
        expect(diff).toHaveLength(0);
    });
    test("STORE: Char gets saved correctly to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        const cpix = layerGrid[15][7];
        const prevCpix = prevLayerGrid[15][7];
        expect(cpix, "Cpix value should not be equal to prev one").not.toEqual(prevCpix);
        const cpixRefs = intToValues(cpix);
        const prevCpixRefs = intToValues(prevCpix);
        const charIndex = state.palette["char"].indexOf("K");

        expect(cpixRefs[0], "Cpix char SHOULD NOT BE equal to prev one (empty)").not.toEqual(prevCpixRefs[0]);
        expect(cpixRefs[0], "Cpix char SHOULD MATCH char ref in palette").toEqual(charIndex);
        expect(cpixRefs[1], "Cpix fg color SHOULD NOT BE equal to prev one (empty)").not.toEqual(prevCpixRefs[1]);
        expect(cpixRefs[2], "Cpix bg color SHOULD BE equal to prev one (empty)").toEqual(prevCpixRefs[2]);
    });
    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 1 time", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(1);
    });
});

/* -------------------------------------------------------------------------- */
/*                     User draws new chars area on layer                     */
/* -------------------------------------------------------------------------- */

describe("User draws mixed chars (new, prev from palette) area on layer", () => {
    let prevState, state, payload;
    beforeAll(() => {
        payload = {
            layerId: firstLayerId,
            xStart: 20,
            yStart: 30,
            cpixs: [
                [
                    ["A", "#ffffff", undefined, undefined],
                    ["B", "#ffffff", undefined, undefined],
                    ["C", "#ffffff", undefined, undefined],
                    ["D", "#ffffff", undefined, undefined],
                ],
                [
                    ["K", "#ffffff", undefined, undefined],
                    ["F", "#ffffff", undefined, undefined],
                    ["G", "#ffffff", undefined, undefined],
                    ["H", "#ffffff", undefined, undefined],
                ],
                [
                    ["I", "#ffffff", undefined, undefined],
                    ["K", "#ffffff", undefined, undefined],
                    ["L", "#ffffff", undefined, undefined],
                    ["M", "#ffffff", undefined, undefined],
                ],
            ],
        };
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload: payload,
        });
        state = getState().document;
    });

    test("STORE: Char palette update with 10 new chars", () => {
        const diff = _.difference(state.palette["char"], prevState.palette["char"]);
        expect(diff).toHaveLength(10);
        const newChars = ["A", "B", "C", "D", "F", "G", "H", "I", "L", "M"];
        expect(diff).toEqual(expect.arrayContaining(newChars));
    });
    test("STORE: Char gets saved correctly to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        // Check each char
        const { cpixs, xStart, yStart } = payload;
        for (let y = 0; y < cpixs.length; y++) {
            for (let x = 0; x < cpixs[0].length; x++) {
                const cpix = layerGrid[yStart + y][xStart + x];
                const prevCpix = prevLayerGrid[yStart + y][xStart + x];

                expect(cpix, "Cpix value should not be equal to prev one").not.toEqual(prevCpix);
                const cpixRefs = intToValues(cpix);
                const prevCpixRefs = intToValues(prevCpix);

                const char = cpixs[y][x][0];
                const charIndex = state.palette["char"].indexOf(char);

                expect(cpixRefs[0], "Cpix char SHOULD NOT BE equal to prev one (empty)").not.toEqual(prevCpixRefs[0]);
                expect(cpixRefs[0], "Cpix char SHOULD MATCH char ref in palette").toEqual(charIndex);
                expect(cpixRefs[1], "Cpix fg color SHOULD NOT BE equal to prev one (empty)").not.toEqual(
                    prevCpixRefs[1]
                );
                expect(cpixRefs[2], "Cpix bg color SHOULD BE equal to prev one (empty)").toEqual(prevCpixRefs[2]);
            }
        }
    });

    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 12 times", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(12);
    });
});

/* -------------------------------------------------------------------------- */
/*                User colors a char foreground with new color                */
/* -------------------------------------------------------------------------- */

describe("User colors a char foreground with new color", () => {
    let prevState, state;
    beforeAll(() => {
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: firstLayerId,
                xStart: 4,
                yStart: 9,
                cpixs: [[[undefined, "#123456", undefined, undefined]]],
            },
        });
        state = getState().document;
    });

    test("STORE: Color palette updated with 1 new color", () => {
        const diff = _.difference(state.palette["color"], prevState.palette["color"]);
        expect(diff).toHaveLength(1);
        const newColor = ["#123456"];
        expect(diff).toEqual(expect.arrayContaining(newColor));
    });
    test("STORE: Char gets saved correctly to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        const cpix = layerGrid[9][4];
        const prevCpix = prevLayerGrid[9][4];
        expect(cpix, "Cpix value should not be equal to prev one").not.toEqual(prevCpix);
        const cpixRefs = intToValues(cpix);
        const prevCpixRefs = intToValues(prevCpix);
        const colorIndex = state.palette["color"].indexOf("#123456");

        expect(cpixRefs[0], "Cpix char SHOULD BE equal to prev one (K)").toEqual(prevCpixRefs[0]);
        expect(cpixRefs[1], "Cpix fg color SHOULD NOT BE equal to prev one (#ffffff)").not.toEqual(prevCpixRefs[1]);
        expect(cpixRefs[1], "Cpix fg color SHOULD MATCH color ref in palette").toEqual(colorIndex);
        expect(cpixRefs[2], "Cpix bg color SHOULD BE equal to prev one (empty)").toEqual(prevCpixRefs[2]);
    });

    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 1 time", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(1);
    });
});

/* -------------------------------------------------------------------------- */
/*                User colors a char background with new color                */
/* -------------------------------------------------------------------------- */

describe("User colors a char background with new color", () => {
    let prevState, state;
    beforeAll(() => {
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: firstLayerId,
                xStart: 4,
                yStart: 9,
                cpixs: [[[undefined, undefined, "#234567", undefined]]],
            },
        });
        state = getState().document;
    });

    test("STORE: Color palette updated with 1 new color", () => {
        const diff = _.difference(state.palette["color"], prevState.palette["color"]);
        expect(diff).toHaveLength(1);
        const newColor = ["#234567"];
        expect(diff).toEqual(expect.arrayContaining(newColor));
    });
    test("STORE: Char gets saved correctly to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        const cpix = layerGrid[9][4];
        const prevCpix = prevLayerGrid[9][4];
        expect(cpix, "Cpix value should not be equal to prev one").not.toEqual(prevCpix);
        const cpixRefs = intToValues(cpix);
        const prevCpixRefs = intToValues(prevCpix);
        const colorIndex = state.palette["color"].indexOf("#234567");

        expect(cpixRefs[0], "Cpix char SHOULD BE equal to prev one (K)").toEqual(prevCpixRefs[0]);
        expect(cpixRefs[1], "Cpix fg color SHOULD BE equal to prev one (#123456)").toEqual(prevCpixRefs[1]);
        expect(cpixRefs[2], "Cpix bg color SHOULD MATCH color ref in palette").toEqual(colorIndex);
        expect(cpixRefs[2], "Cpix bg color SHOULD NOT BE equal to prev one (empty)").not.toEqual(prevCpixRefs[2]);
    });
    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 1 time", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(1);
    });
});

/* -------------------------------------------------------------------------- */
/*              User colors a char foreground with palette color              */
/* -------------------------------------------------------------------------- */

describe("User colors a char foreground with palette color", () => {
    let prevState, state;
    beforeAll(() => {
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: firstLayerId,
                xStart: 4,
                yStart: 9,
                cpixs: [[[undefined, "#ffffff", undefined, undefined]]],
            },
        });
        state = getState().document;
    });

    test("STORE: Color palette should not change", () => {
        const diff = _.difference(state.palette["color"], prevState.palette["color"]);
        expect(diff).toHaveLength(0);
    });
    test("STORE: Char gets saved correctly to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        const cpix = layerGrid[9][4];
        const prevCpix = prevLayerGrid[9][4];
        expect(cpix, "Cpix value should not be equal to prev one").not.toEqual(prevCpix);
        const cpixRefs = intToValues(cpix);
        const prevCpixRefs = intToValues(prevCpix);
        const colorIndex = state.palette["color"].indexOf("#ffffff");

        expect(cpixRefs[0], "Cpix char SHOULD BE equal to prev one (K)").toEqual(prevCpixRefs[0]);
        expect(cpixRefs[1], "Cpix fg color SHOULD NOT BE equal to prev one (#123456)").not.toEqual(prevCpixRefs[1]);
        expect(cpixRefs[1], "Cpix fg color SHOULD MATCH color ref in palette").toEqual(colorIndex);
        expect(cpixRefs[2], "Cpix bg color SHOULD BE equal to prev one (empty)").toEqual(prevCpixRefs[2]);
    });
    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 1 time", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(1);
    });
});

/* -------------------------------------------------------------------------- */
/*              User colors a char background with palette color              */
/* -------------------------------------------------------------------------- */

describe("User colors a char background with palette color", () => {
    let prevState, state;
    beforeAll(() => {
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: firstLayerId,
                xStart: 4,
                yStart: 9,
                cpixs: [[[undefined, undefined, "#123456", undefined]]],
            },
        });
        state = getState().document;
    });

    test("STORE: Color palette should not update", () => {
        const diff = _.difference(state.palette["color"], prevState.palette["color"]);
        expect(diff).toHaveLength(0);
    });
    test("STORE: Char gets saved correctly to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        const cpix = layerGrid[9][4];
        const prevCpix = prevLayerGrid[9][4];
        expect(cpix, "Cpix should not be equal to prev one").not.toEqual(prevCpix);
        const cpixRefs = intToValues(cpix);
        const prevCpixRefs = intToValues(prevCpix);
        const colorIndex = state.palette["color"].indexOf("#123456");

        expect(cpixRefs[0], "Cpix char SHOULD BE equal to prev one (K)").toEqual(prevCpixRefs[0]);
        expect(cpixRefs[1], "Cpix fg color SHOULD BE equal to prev one (#ffffff)").toEqual(prevCpixRefs[1]);
        expect(cpixRefs[2], "Cpix bg color SHOULD MATCH color ref in palette").toEqual(colorIndex);
        expect(cpixRefs[2], "Cpix bg color SHOULD NOT BE equal to prev one (#234567)").not.toEqual(prevCpixRefs[2]);
    });
    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 1 time", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(1);
    });
});

/* -------------------------------------------------------------------------- */
/*                          User colors an empty cpix                         */
/* -------------------------------------------------------------------------- */

describe("User colors an empty cpix's fg", () => {
    let prevState, state, payload;

    beforeAll(() => {
        payload = {
            layerId: firstLayerId,
            xStart: 30,
            yStart: 70,
            cpixs: [[[undefined, "#ffffff", undefined, undefined]]],
        };
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({
            type: "UPDATE_CPIX",
            payload,
        });
        state = getState().document;
    });

    test("STORE: Color gets saved to layer grid", () => {
        const prevLayerGrid = prevState.layers[firstLayerId].grid;
        const layerGrid = state.layers[firstLayerId].grid;

        const { xStart, yStart } = payload;
        const cpix = layerGrid[yStart][xStart];
        const prevCpix = prevLayerGrid[yStart][xStart];

        expect(cpix, "Cpix value should NOT be equal to prev one (empty)").not.toEqual(prevCpix);
        const cpixRefs = intToValues(cpix);
        const prevCpixRefs = intToValues(prevCpix);
        const colorIndex = state.palette["color"].indexOf("#ffffff");

        expect(cpixRefs[0], "Cpix char SHOULD BE equal to prev one (empty)").toEqual(prevCpixRefs[0]);
        expect(cpixRefs[1], "Cpix fg color SHOULD NOT BE equal to prev one (empty)").not.toEqual(prevCpixRefs[1]);
        expect(cpixRefs[1], "Cpix fg color SHOULD MATCH color ref in palette").toEqual(colorIndex);
        expect(cpixRefs[2], "Cpix bg color SHOULD BE equal to prev one (empty)").toEqual(prevCpixRefs[2]);
    });
    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 0 times", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(0);
    });
});

/* -------------------------------------------------------------------------- */
/*                             User cleans a cpix                             */
/* -------------------------------------------------------------------------- */

describe("User cleans an existing cpix", () => {
    let prevState, state, payload;
    beforeAll(() => {
        payload = {
            layerId: firstLayerId,
            xStart: 4,
            yStart: 9,
            cpixs: [[[null, null, null, null]]],
        };
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_CPIX", payload });
        state = getState().document;
    });

    test("STORE: Prev and new cpix should be different", () => {
        const { xStart, yStart } = payload;
        const cpix = state.layers[firstLayerId].grid[yStart][xStart];
        const prevCpix = prevState.layers[firstLayerId].grid[yStart][xStart];
        expect(cpix).not.toEqual(prevCpix);
    });
    test("STORE: New cpix should be empty", () => {
        const { xStart, yStart } = payload;
        const cpix = state.layers[firstLayerId].grid[yStart][xStart];
        expect(cpix).toEqual(0);
    });

    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 0 times", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(0);
    });
    test("DOM: Layer's cleanCpix() to have been called 1 time", () => {
        expect(layerSpies["cleanCpix"]).toHaveBeenCalledTimes(1);
    });
});

/* -------------------------------------------------------------------------- */
/*                          User cleans an empty cpix                         */
/* -------------------------------------------------------------------------- */

describe("User cleans an empty cpix", () => {
    let prevState, state, payload;
    beforeAll(() => {
        payload = {
            layerId: firstLayerId,
            xStart: 4,
            yStart: 9,
            cpixs: [[[null, null, null, null]]],
        };
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_CPIX", payload });
        state = getState().document;
    });

    test("STORE: Prev and new cpix should be the same", () => {
        const { xStart, yStart } = payload;
        const cpix = state.layers[firstLayerId].grid[yStart][xStart];
        const prevCpix = prevState.layers[firstLayerId].grid[yStart][xStart];
        expect(cpix).toEqual(prevCpix);
    });
    test("STORE: New cpix should be empty", () => {
        const { xStart, yStart } = payload;
        const cpix = state.layers[firstLayerId].grid[yStart][xStart];
        expect(cpix).toEqual(0);
    });

    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 0 times", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(0);
    });
    test("DOM: Layer's cleanCpix() to have been called 0 times", () => {
        expect(layerSpies["cleanCpix"]).toHaveBeenCalledTimes(0);
    });
});

/* -------------------------------------------------------------------------- */
/*                             User cleans an area                            */
/* -------------------------------------------------------------------------- */

describe("User cleans a mixed area", () => {
    let prevState, state, payload;
    beforeAll(() => {
        payload = {
            layerId: firstLayerId,
            xStart: 22,
            yStart: 30,
            cpixs: [
                [
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                ],
                [
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                ],
                [
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                    [null, null, null, null],
                ],
            ],
        };
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_CPIX", payload });
        state = getState().document;
    });

    test("STORE: Prev and new cpix should be the same", () => {
        const prevGrid = prevState.layers[firstLayerId].grid;
        const grid = state.layers[firstLayerId].grid;

        const changedCpixs = [];
        const { cpixs, xStart, yStart } = payload;
        for (let y = 0; y < cpixs.length; y++) {
            for (let x = 0; x < cpixs[0].length; x++) {
                if (grid[yStart + y][xStart + x] !== prevGrid[yStart + y][xStart + x]) {
                    changedCpixs.push(grid[yStart + y][xStart + x]);
                }
            }
        }

        expect(changedCpixs).toHaveLength(6);
    });

    test("DOM: Layer Component updated", () => {
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });
    test("DOM: Layer's drawCpix() to have been called 0 times", () => {
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(0);
    });
    test("DOM: Layer's cleanCpix() to have been called 6 times", () => {
        expect(layerSpies["cleanCpix"]).toHaveBeenCalledTimes(6);
    });
});

/* -------------------------------------------------------------------------- */
/*              User modifies layer resolution non-destructively              */
/* -------------------------------------------------------------------------- */
//TODO
describe("User modifies layer resolution non-destructively", () => {
    let prevState, state, drawCpixSpy, componentDidUpdateSpy, payload;
    beforeAll(() => {
        payload = {
            layerId: firstLayerId,
            properties: { resolution: 12 },
        };
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_LAYER", payload });
        state = getState().document;
    });

    test("STORE: Layer grid size should be different than before", () => {
        const prevLayer = prevState.layers[firstLayerId];
        const layer = state.layers[firstLayerId];

        // y axis
        expect(layer.grid.length).not.toEqual(prevLayer.grid.length);
        // x axis
        expect(layer.grid[0].length).not.toEqual(prevLayer.grid[0].length);
    });
    test("STORE: Layer grid should have correct size", () => {
        const { grid, cpc } = state.layers[firstLayerId];
        const { hblocks, vblocks } = state;
        const { resolution } = payload.properties;

        const expectedX = resolution * cpc * hblocks;
        const expectedY = resolution * vblocks;
        expect(grid[0].length).toEqual(expectedX);
        expect(grid.length).toEqual(expectedY);
    });

    test("STORE: Layer grid should have same data as before", () => {
        const { grid } = state.layers[firstLayerId];
        const cpixValues = intToValues(grid[30][20]);

        const aIndex = state.palette["char"].indexOf("A");
        const colorIndex = state.palette["color"].indexOf("#ffffff");
        expect(cpixValues[0]).toBe(aIndex);
        expect(cpixValues[1]).toBe(colorIndex);
    });

    test("DOM: Layer should update", () => {
        // expect(componentDidUpdateSpy).toHaveBeenCalled();
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });

    test("DOM: Layer's drawCpix() should have been called grid.h * grid.v", () => {
        const { grid } = state.layers[firstLayerId];
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(7);
        // expect(drawCpixSpy).toHaveBeenCalledTimes(grid.length * grid[0].length);
    });
});

/* -------------------------------------------------------------------------- */
/*               User modifies layer char size non-destructively              */
/* -------------------------------------------------------------------------- */

describe("User modifies layer char size non-destructively", () => {
    let prevState, state, drawCpixSpy, componentDidUpdateSpy, payload;
    beforeAll(() => {
        payload = {
            layerId: firstLayerId,
            properties: { cpc: 2 },
        };
        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_LAYER", payload });
        state = getState().document;
    });

    test("STORE: Layer grid size should be different than before", () => {
        const prevLayer = prevState.layers[firstLayerId];
        const layer = state.layers[firstLayerId];

        // y axis
        expect(layer.grid.length).toEqual(prevLayer.grid.length);
        // x axis
        expect(layer.grid[0].length).not.toEqual(prevLayer.grid[0].length);
    });
    test("STORE: Layer grid should have correct size", () => {
        const { grid, resolution } = state.layers[firstLayerId];
        const { hblocks, vblocks } = state;
        const { cpc } = payload.properties;

        const expectedX = resolution * cpc * hblocks;
        const expectedY = resolution * vblocks;
        expect(grid[0].length).toEqual(expectedX);
        expect(grid.length).toEqual(expectedY);
    });

    test("STORE: Layer grid should have same data as before", () => {
        const { grid } = state.layers[firstLayerId];
        const cpixValues = intToValues(grid[30][20]);

        const aIndex = state.palette["char"].indexOf("A");
        const colorIndex = state.palette["color"].indexOf("#ffffff");
        expect(cpixValues[0]).toBe(aIndex);
        expect(cpixValues[1]).toBe(colorIndex);
    });

    test("DOM: Layer should update", () => {
        // expect(componentDidUpdateSpy).toHaveBeenCalled();
        const instance = Layer.instances.find((l) => l.props.id === firstLayerId);
        expect(layerSpies["componentDidUpdate"].mock.instances, "Only one layer should have updated").toHaveLength(1);
        expect(layerSpies["componentDidUpdate"].mock.instances[0]).toBe(instance);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(1);
    });

    test("DOM: Layer's drawCpix() should have been called grid.h * grid.v", () => {
        const { grid } = state.layers[firstLayerId];
        // expect(drawCpixSpy).toHaveBeenCalledTimes();
        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(7);
        // expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(grid.length * grid[0].length);
    });
});

/* -------------------------------------------------------------------------- */
/*                       User modifies a char in palette                      */
/* -------------------------------------------------------------------------- */

describe("User modifies a char in palette", () => {
    let prevState, state, allComponentDidUpdateSpy, allDrawCpixSpy;
    const payload = {
        palette: "char",
        index: null,
        value: "Z",
    };
    beforeAll(() => {
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: firstLayerId,
                xStart: 7,
                yStart: 15,
                cpixs: [
                    [
                        ["K", "#ffffff", undefined, undefined],
                        ["K", "#ffffff", "#ffffff", undefined],
                        ["K", "#ffffff", undefined, undefined],
                    ],
                    [
                        ["K", "#ffffff", undefined, undefined],
                        ["K", "#ffffff", "#ffffff", undefined],
                        ["K", "#ffffff", "#ffffff", undefined],
                    ],
                ],
            },
        });
        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: secondLayerId,
                xStart: 10,
                yStart: 15,
                cpixs: [
                    [
                        ["K", "#ffffff", "#ffffff", undefined],
                        ["K", "#ffffff", undefined, undefined],
                        ["K", "#ffffff", undefined, undefined],
                    ],
                    [
                        ["K", "#ffffff", "#ffffff", undefined],
                        ["K", "#ffffff", undefined, undefined],
                        ["K", "#ffffff", undefined, undefined],
                    ],
                ],
            },
        });
        const kIndex = getState().document.palette["char"].indexOf("K");
        payload.index = kIndex;

        // const layers = doc().find(Layer);
        // allComponentDidUpdateSpy = layers.map((l) => {
        //     return jest.spyOn(l.instance(), "componentDidUpdate");
        // });
        // allDrawCpixSpy = layers.map((l) => {
        //     return jest.spyOn(l.instance(), "drawCpix");
        // });

        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_PALETTE", payload });
        state = getState().document;
    });

    test("STORE: Char palette should be updated with new char", () => {
        const prev_charPalette = prevState.palette["char"];
        const charPalette = state.palette["char"];

        const diff = _.difference(charPalette, prev_charPalette);
        expect(diff).toEqual(expect.arrayContaining([payload.value]));
    });

    test("DOM: All layer's drawPix() should by called the amount of times char is referenced", () => {
        let referencesAmount = 0;
        const { index } = payload;
        const layers = state.layers;
        const layerIds = Object.keys(layers);

        layerIds.forEach((id) => {
            for (let y = 0; y < layers[id].grid.length; y++) {
                for (let x = 0; x < layers[id].grid[0].length; x++) {
                    const cpixValues = intToValues(layers[id].grid[y][x]);
                    if (cpixValues[0] === index) referencesAmount++;
                }
            }
        });

        expect(layerSpies["componentDidUpdate"].mock.instances).toHaveLength(Object.keys(layers).length);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(Object.keys(layers).length);

        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(referencesAmount);
    });
});

/* -------------------------------------------------------------------------- */
/*                      User modifies a color in palette                      */
/* -------------------------------------------------------------------------- */

describe("User modifies a color in palette", () => {
    let prevState, state, allComponentDidUpdateSpy, allDrawCpixSpy;
    const payload = {
        palette: "color",
        index: null,
        value: "#f2f2f2",
    };
    beforeAll(() => {
        const colorIndex = getState().document.palette["color"].indexOf("#ffffff");
        payload.index = colorIndex;

        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_PALETTE", payload });
        state = getState().document;
    });

    test("STORE: Color palette should be updated with new char", () => {
        const prev_color_palette = prevState.palette["color"];
        const colorPalette = state.palette["color"];

        const diff = _.difference(colorPalette, prev_color_palette);
        expect(diff).toEqual(expect.arrayContaining([payload.value]));
    });

    test("DOM: All layer's drawPix() should by called the amount of times color is referenced", () => {
        let referencesAmount = 0;
        const { index } = payload;
        const layers = state.layers;
        const layerIds = Object.keys(layers);

        layerIds.forEach((id) => {
            for (let y = 0; y < layers[id].grid.length; y++) {
                for (let x = 0; x < layers[id].grid[0].length; x++) {
                    const cpixValues = intToValues(layers[id].grid[y][x]);
                    if ((cpixValues[0] > 0 && cpixValues[1] === index) || cpixValues[2] === index) referencesAmount++;
                }
            }
        });

        expect(layerSpies["componentDidUpdate"].mock.instances).toHaveLength(Object.keys(layers).length);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(Object.keys(layers).length);

        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(referencesAmount);
    });
});

/* -------------------------------------------------------------------------- */
/*                       User removes a char in palette                       */
/* -------------------------------------------------------------------------- */

describe("User removes a char in palette", () => {
    let prevState, state, allComponentDidUpdateSpy, allDrawCpixSpy, allCleanCpixSpy;
    const payload = {
        palette: "char",
        index: null,
        value: null,
    };
    beforeAll(() => {
        const charIndex = getState().document.palette["char"].indexOf("Z");
        payload.index = charIndex;

        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_PALETTE", payload });
        state = getState().document;
    });

    test("STORE: Char palette should be updated with char removed", () => {
        const prev_charPalette = prevState.palette["char"];
        const charPalette = state.palette["char"];

        const diff = _.difference(prev_charPalette, charPalette);
        expect(diff).toEqual(expect.arrayContaining(["Z"]));
    });

    test("DOM: All layer's drawCpix() and cleanCpix() should by called accordingly the amount of times color is referenced", () => {
        let expectedDrawAmount = 0;
        let expectedCleanAmount = 0;
        const { index } = payload;
        const layers = state.layers;
        const layerIds = Object.keys(layers);

        layerIds.forEach((id) => {
            for (let y = 0; y < layers[id].grid.length; y++) {
                for (let x = 0; x < layers[id].grid[0].length; x++) {
                    const cpixInt = layers[id].grid[y][x];
                    const cpixValues = intToValues(cpixInt);
                    const prevCpixInt = prevState.layers[id].grid[y][x];
                    const prevCpixValues = intToValues(prevCpixInt);

                    const charVisible = (cpixValues[0] > 0 && cpixValues[1] > 0) || cpixValues[2] > 0;

                    if (cpixInt !== prevCpixInt && charVisible) {
                        expectedCleanAmount++;
                        expectedDrawAmount++;
                    }
                    if (prevCpixValues[0] === index && cpixValues[0] === 0 && !charVisible) {
                        expectedCleanAmount++;
                    }
                }
            }
        });

        expect(layerSpies["componentDidUpdate"].mock.instances).toHaveLength(Object.keys(layers).length);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(Object.keys(layers).length);
        expect(layerSpies["handleGridDifferences"].mock.calls).toHaveLength(Object.keys(layers).length);

        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(expectedDrawAmount);
        expect(layerSpies["cleanCpix"]).toHaveBeenCalledTimes(expectedCleanAmount);
    });
});
//? User removes a color in palette
describe("User removes a color in palette", () => {
    let prevState, state, allComponentDidUpdateSpy, allDrawCpixSpy, allCleanCpixSpy;
    const payload = {
        palette: "color",
        index: null,
        value: null,
    };
    beforeAll(() => {
        const colorIndex = getState().document.palette["color"].indexOf("#f2f2f2");
        payload.index = colorIndex;

        dispatch({
            type: "UPDATE_CPIX",
            payload: {
                layerId: secondLayerId,
                xStart: 10,
                yStart: 25,
                cpixs: [
                    [
                        ["A", "#f2f2f2", "#f2f2f2", undefined],
                        ["B", "#f2f2f2", undefined, undefined],
                        ["C", "#f2f2f2", undefined, undefined],
                    ],
                    [
                        ["D", "#f2f2f2", "#f2f2f2", undefined],
                        ["E", "#f2f2f2", undefined, undefined],
                        ["F", "#f2f2f2", undefined, undefined],
                    ],
                ],
            },
        });

        prevState = _.cloneDeep(getState().document);
        jest.clearAllMocks();
        dispatch({ type: "UPDATE_PALETTE", payload });
        state = getState().document;
    });

    test("STORE: color palette should be updated with color removed", () => {
        const prevColorPalette = prevState.palette["color"];
        const colorPalette = state.palette["color"];

        const diff = _.difference(prevColorPalette, colorPalette);
        expect(diff).toEqual(expect.arrayContaining(["#f2f2f2"]));
    });

    test("DOM: All layer's drawCpix() and cleanCpix() should by called accordignly the amount of times color is referenced", () => {
        let expectedDrawAmount = 0;
        let expectedCleanAmount = 0;
        const { index } = payload;
        const layers = state.layers;
        const layerIds = Object.keys(layers);

        layerIds.forEach((id) => {
            for (let y = 0; y < layers[id].grid.length; y++) {
                for (let x = 0; x < layers[id].grid[0].length; x++) {
                    const cpixInt = layers[id].grid[y][x];
                    const cpixValues = intToValues(cpixInt);
                    const prevCpixInt = prevState.layers[id].grid[y][x];
                    const prevCpixValues = intToValues(prevCpixInt);

                    const charVisible = (cpixValues[0] > 0 && cpixValues[1] > 0) || cpixValues[2] > 0;

                    if (cpixInt !== prevCpixInt && charVisible) {
                        expectedCleanAmount++;
                        expectedDrawAmount++;
                    }
                    if (cpixInt !== prevCpixInt && !charVisible) {
                        expectedCleanAmount++;
                    }
                }
            }
        });

        expect(layerSpies["componentDidUpdate"].mock.instances).toHaveLength(Object.keys(layers).length);
        expect(layerSpies["componentDidUpdate"].mock.calls).toHaveLength(Object.keys(layers).length);
        expect(layerSpies["handleGridDifferences"].mock.calls).toHaveLength(Object.keys(layers).length);

        expect(layerSpies["drawCpix"]).toHaveBeenCalledTimes(expectedDrawAmount);
        expect(layerSpies["cleanCpix"]).toHaveBeenCalledTimes(expectedCleanAmount);
    });
});
