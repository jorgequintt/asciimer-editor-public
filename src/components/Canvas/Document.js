import React, { Component, Fragment } from "react";
import Layer from "./Layer";

// Redux
import { connect } from "react-redux";
import CanvasUI from "../Layout/CanvasUI";

export class Document extends Component {
    componentDidMount() { }

    componentDidUpdate() { }

    render() {
        const { layers, hblocks, vblocks, ppb, selectedLayer } = this.props;

        const validSelectedLayer = layers[selectedLayer] === undefined ? null : selectedLayer;

        const layerIds = Object.keys(layers);

        const width = hblocks * ppb;
        const height = vblocks * ppb;

        const style = {
            width,
            height,
            border: "1px solid #A0A0A0",
            boxSizing: "content-box",
            position: "absolute",
        };

        return (
            <div style={style}>
                {validSelectedLayer && <CanvasUI selectedLayer={validSelectedLayer} width={width} height={height} />}
                {layerIds.map((id) => (
                    <Layer key={id} id={id} width={width} height={height} />
                ))}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    layers: state.document.layers,
    selectedLayer: state.documentPanel.selectedLayer
});

export default connect(mapStateToProps)(Document);
