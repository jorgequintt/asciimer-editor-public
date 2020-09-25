import React, { Component } from "react";
import { cpixIntToValues, intToValues } from "../../util/functions";

// Redux
import { connect } from "react-redux";

export class Layer extends Component {
    constructor(props) {
        super(props);

        this.setupLayerProperties = this.setupLayerProperties.bind(this);
        this.cleanLayer = this.cleanLayer.bind(this);
        this.layerRef = React.createRef();
    }

    componentDidMount() {
        this.ctx = this.layerRef.current.getContext("2d");
        this.ctx.webkitImageSmoothingEnabled = false;
        this.setupLayerProperties();
        this.handleRedrawEntireGrid(this.props.grid);
        // this.handleGridDifferences(this.props.grid, null, true);
    }

    shouldRedrawGrid(props, prev) {
        return (
            // layer
            props.cpc !== prev.cpc ||
            props.resolution !== prev.resolution ||
            props.text_margin !== prev.text_margin ||
            props.text_weight !== prev.text_weight ||
            // document
            props.ppb !== prev.ppb ||
            props.hblocks !== prev.hblocks ||
            props.vblocks !== prev.vblocks
        );
    }

    setupLayerProperties() {
        const { resolution, ppb, cpc, text_margin } = this.props;
        this.char_height = (ppb / resolution);
        this.char_width = (ppb / resolution) / cpc;

        this.fontSize = this.char_height - text_margin;
        this.ctx.textAlign = "center";
        this.ctx.textBaseline = "middle";
    }

    componentDidUpdate(prevProps) {
        this.setupLayerProperties();

        // if layer morfed in any way
        const shouldRedraw = this.shouldRedrawGrid(this.props, prevProps);
        if (shouldRedraw) {
            this.handleRedrawEntireGrid(this.props.grid);
            return; // we exit here for code readibility
        }

        // if grid changed
        if (this.props.grid !== prevProps.grid) {
            this.handleGridDifferences(this.props.grid, prevProps.grid);
            return;
        }

        // if palette changed
        const charPaletteChanged = this.props.char_palette !== prevProps.char_palette;
        const colorPaletteChanged = this.props.color_palette !== prevProps.color_palette;
        if (charPaletteChanged || colorPaletteChanged) {
            const paletteType = charPaletteChanged ? "char" : "color";
            let valueIndex = [];
            for (let i = 0; i < this.props[`${paletteType}_palette`].length; i++) {
                // find index that changed so we can update it 
                if (this.props[`${paletteType}_palette`][i] !== prevProps[`${paletteType}_palette`][i]) {
                    valueIndex.push(i);
                    // break;
                }
            }
            this.handlePaletteUpdate(this.props.grid, paletteType, valueIndex);
        }
        return;
    }

    handleGridDifferences(grid, prevGrid, force = false) {
        for (let y = 0; y < grid.length; y++) {
            if (grid[y] === prevGrid[y]) continue;
            for (let x = 0; x < grid[0].length; x++) {
                if (grid[y][x] === prevGrid[y][x]) continue;
                this.cleanCpix(x, y);

                const values = intToValues(grid[y][x]);
                const visibleChar = values[0] > 0 && values[1] > 0;

                // if no visible char and no background
                if (!visibleChar && values[2] === 0) continue; // if cpix has no visibility, we skip
                this.drawCpix(values, x, y);
            }
        }
    }

    handleRedrawEntireGrid(grid) {
        this.cleanLayer();
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[0].length; x++) {
                const values = intToValues(grid[y][x]);
                const visibleChar = values[0] > 0 && values[1] > 0;

                // if no visible char and no background
                if (!visibleChar && values[2] === 0) continue; // if cpix has no visibility, we skip
                this.drawCpix(values, x, y);
            }
        }
    }

    handlePaletteUpdate(grid, valueType, valueIndex) {
        for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[0].length; x++) {
                const values = intToValues(grid[y][x]);

                // early exit if not targeted pix
                if (values[0] === 0 && values[2] === 0) continue; // exit if non visible
                if (valueType === "char") {
                    if (valueIndex.indexOf(values[0]) === -1) continue;
                } else if (valueType === "color") {
                    if (valueIndex.indexOf(values[1]) === -1 && valueIndex.indexOf(values[2]) === -1) continue;
                }

                // if we get here, we should draw
                this.cleanCpix(x, y);
                this.drawCpix(values, x, y);
            }
        }
    }

    cleanLayer() {
        this.ctx.clearRect(0, 0, this.props.width, this.props.height);
    }

    cleanCpix(x, y) {
        this.ctx.clearRect(x * this.char_width, y * this.char_height, this.char_width, this.char_height);
    }

    drawCpix(values, x, y) {
        // Draw background
        if (values[2]) {
            this.ctx.fillStyle = this.props.color_palette[values[2]];
            this.ctx.fillRect(
                x * this.char_width, y * this.char_height,
                this.char_width, this.char_height
            );
        }

        // Draw text
        const char = this.props.char_palette[values[0]];
        const [fontIndex, charUnicode] = cpixIntToValues(char);
        const fontName = this.props.fonts[fontIndex];
        this.ctx.font = `${this.props.text_weight} ${this.fontSize}px "${fontName}", "Adobe Blank"`;

        const fgColor = this.props.color_palette[values[1]];
        this.ctx.fillStyle = fgColor;

        const center_x = (x * this.char_width) + (this.char_width / 2);
        const center_y = (y * this.char_height) + (this.char_height / 2);
        this.ctx.fillText(String.fromCharCode(charUnicode), center_x, center_y);
    }

    render() {
        const { isolateSelectedLayer, bringSelectedLayerToFront, grayOutUnfocusedLayers, selectedLayer, visible, id } = this.props;

        let zIndex = 99 - this.props.index;
        let display = "block";
        let opacity = 1;

        if (!visible || (isolateSelectedLayer && selectedLayer !== id)) display = "none";
        if (bringSelectedLayerToFront && selectedLayer === id) zIndex = 100;
        if (grayOutUnfocusedLayers && selectedLayer !== id) opacity = 0.18;

        return (
            <canvas
                ref={this.layerRef}
                width={this.props.width}
                height={this.props.height}
                style={{ zIndex, display, opacity, position: "absolute" }}
            />
        );
    }
}

const mapStateToProps = (state, ownProps) => ({
    // layer specific
    grid: state.document.layers[ownProps.id].grid,
    visible: state.document.layers[ownProps.id].visible,
    index: state.document.layers[ownProps.id].index,
    cpc: state.document.layers[ownProps.id].cpc,
    resolution: state.document.layers[ownProps.id].resolution,
    text_margin: state.document.layers[ownProps.id].text_margin,
    text_weight: state.document.layers[ownProps.id].text_weight,
    // document
    char_palette: state.document.palette.char,
    color_palette: state.document.palette.color,
    fonts: state.document.fonts,
    ppb: state.document.ppb,
    hblocks: state.document.hblocks,
    vblocks: state.document.vblocks,
    selectedLayer: state.documentPanel.selectedLayer,
    // options
    isolateSelectedLayer: state.options.isolateSelectedLayer,
    bringSelectedLayerToFront: state.options.bringSelectedLayerToFront,
    grayOutUnfocusedLayers: state.options.grayOutUnfocusedLayers,
});

export default connect(mapStateToProps)(Layer);
