import React, { Component, Fragment } from "react";
import Document from "../Canvas/Document";
import Panzoom from "@panzoom/panzoom";

// Redux
import { connect } from "react-redux";
import { update as colorPanelUpdate } from '../../redux/actions/colorPanelActions';
import { update as charPanelUpdate } from '../../redux/actions/charPanelActions';
import { undo, redo, saveDocument } from '../../redux/actions/documentActions';

export class Drawboard extends Component {
    state = {
        panning: false,
        xWheelQuota: 0,
        yWheelQuota: 0,
    };

    wrapper = React.createRef();
    drawboard = React.createRef();

    componentDidMount() {
        const opts = {
            minScale: 0.15,
            maxScale: 5,
            noBind: true,
            relative: true,
            cursor: "default",
            startX: 0,
            startY: 0,
            startScale: 1,
        };
        this.panzoom = Panzoom(this.drawboard.current, opts);
        window.addEventListener("keydown", this.handleKeyDown);
    }

    handleWheel = (e) => {
        const { xWheelQuota, yWheelQuota } = this.state;
        const { altDown, shiftDown, ctrlDown } = this.props;

        // pan
        if (altDown) {
            this.panzoom.zoom(this.panzoom.getScale() + (e.deltaY / 300) * -1);
            return;
        }

        // handle moving char / color selection with 2d wheel
        const moveX = Math.abs(xWheelQuota) > 230 ? Math.sign(xWheelQuota) : 0;
        const moveY = Math.abs(yWheelQuota) > 230 ? Math.sign(yWheelQuota) : 0;
        if (moveX === 0 && moveY === 0) {
            if (moveX === 0) this.setState({ xWheelQuota: xWheelQuota + e.deltaX });
            if (moveY === 0) this.setState({ yWheelQuota: yWheelQuota + e.deltaY });
            return;
        } else {
            if (moveX !== 0) this.setState({ xWheelQuota: 0 });
            if (moveY !== 0) this.setState({ yWheelQuota: 0 });
        }

        const { selectedPaletteChar, char_palette, selectedBgColor, selectedFgColor, color_palette } = this.props;

        let targetPalette, targetSelected, panelUpdaterName, propertyNameInPanel;
        if ((shiftDown && !ctrlDown) || (ctrlDown && !shiftDown)) {
            targetPalette = color_palette;
            panelUpdaterName = "colorPanelUpdate";
            if (shiftDown) {
                targetSelected = selectedFgColor;
                propertyNameInPanel = "fgSelection";
            } else {
                targetSelected = selectedBgColor;
                propertyNameInPanel = "bgSelection";
            }
        } else {
            targetPalette = char_palette;
            panelUpdaterName = "charPanelUpdate";
            propertyNameInPanel = "charPaletteSelection";
            targetSelected = selectedPaletteChar;
        }

        // move selected
        if (targetSelected === null) { this.props[panelUpdaterName]({ [propertyNameInPanel]: 0 }) }
        else {
            const filteredPalette = targetPalette.filter(c => c !== undefined);
            let newIndex = targetSelected;

            const preMoveX = newIndex + moveX;
            if (preMoveX <= filteredPalette.length - 1 && preMoveX >= 0) newIndex += moveX;

            const preMoveY = newIndex + (16 * moveY);
            if (preMoveY <= filteredPalette.length - 1 && preMoveY >= 0) newIndex += (16 * moveY);

            if (newIndex !== targetSelected) this.props[panelUpdaterName]({ [propertyNameInPanel]: newIndex });
        }
    }

    handleMousedown = (e) => {
        if (this.props.altDown && e.button === 0) {
            this.setState({ panning: true });
            e.stopPropagation();
        } else if (this.props.altDown && e.button === 2) {
            this.panzoom.setOptions({ relative: false });
            this.panzoom.reset();
            this.panzoom.setOptions({ relative: true });
        }
    }

    handleMouseup = (e) => {
        if (e.button === 0) this.setState({ panning: false });
    }

    handleMousemove = (e) => {
        if (this.state.panning) {
            this.panzoom.pan(e.movementX / this.panzoom.getScale(), e.movementY / this.panzoom.getScale());
        }
    }

    handleKeyDown = (e) => {
        const { ctrlDown } = this.props;
        if (ctrlDown && e.keyCode === 90) this.props.undo(); // z
        if (ctrlDown && e.keyCode === 89) this.props.redo(); // y
        if (ctrlDown && e.keyCode === 83) { e.preventDefault(); this.props.saveDocument(); } // s
        if (ctrlDown && e.keyCode === 79) { e.preventDefault(); document.querySelector('#jq-project-load-input').click(); } // o
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextState !== this.state) return true;
        else if (nextProps.hblocks !== this.props.hblocks) return true;
        else if (nextProps.vblocks !== this.props.vblocks) return true;
        else if (nextProps.ppb !== this.props.ppb) return true;
        else if (nextProps.created !== this.props.created) return true;
        else return false;
    }

    render() {
        const { created, hblocks, vblocks, ppb } = this.props;

        return (
            <div ref={this.wrapper}
                onWheel={this.handleWheel}
                onMouseDownCapture={this.handleMousedown}
                onMouseUp={this.handleMouseup}
                onMouseMove={this.handleMousemove}
                style={{ height: "calc(100vh - 50px)" }}>
                <div
                    ref={this.drawboard}
                    className="jq-drawboard"
                    style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}
                >
                    {created && <Document hblocks={hblocks} vblocks={vblocks} ppb={ppb} />}
                </div>
            </div>
        );
        // return <Document hblocks={hblocks} vblocks={vblocks} ppb={ppb} />;
    }
}

const mapStateToProps = (state) => ({
    hblocks: state.document.hblocks,
    vblocks: state.document.vblocks,
    ppb: state.document.ppb,
    created: state.document.created,
    char_palette: state.document.palette.char,
    color_palette: state.document.palette.color,

    selectedPaletteChar: state.charPanel.charPaletteSelection,
    selectedBgColor: state.colorPanel.bgSelection,
    selectedFgColor: state.colorPanel.fgSelection,

    altDown: state.ui.altDown,
    ctrlDown: state.ui.ctrlDown,
    shiftDown: state.ui.shiftDown,
});

const mapDispatchToProps = {
    colorPanelUpdate,
    charPanelUpdate,
    undo, redo,
    saveDocument,
}

export default connect(mapStateToProps, mapDispatchToProps)(Drawboard);
