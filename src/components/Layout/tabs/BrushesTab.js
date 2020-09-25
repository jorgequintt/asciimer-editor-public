import React, { Component, Fragment } from 'react'
import Grid from "../grids/Grid";
import GridCellBrush from "../grids/GridCellBrush";
import { cpixValuesToInt } from "../../../util/functions";

// Style
import { ContextMenu, Menu, MenuItem, Checkbox, Label, Divider } from "@blueprintjs/core";

// Redux
import { connect } from 'react-redux';
import { update as brushesUpdate, removeBrush } from '../../../redux/actions/brushesActions';

export class BrushesTab extends Component {
    state = {
        contextMenuOpen: false
    }

    handleBrushClick = (e) => {
        if (e === null) return;
        const index = parseInt(e.target.getAttribute('data-index'));
        this.props.brushesUpdate({ selectedBrush: index });
    }

    handleBrushDoubleClick = (e) => { }

    handleBrushRightClick = (e) => {
        if (e.target === null) return;

        const index = parseInt(e.target.getAttribute('data-index'));
        ContextMenu.show(
            (
                <Menu>
                    <MenuItem icon="trash" onClick={e => this.props.removeBrush(index)} text="Remove Brush" />
                </Menu>
            ),
            { top: e.clientY, left: e.clientX },
            (e) => this.setState({ contextMenuOpen: false }),
            true
        );
        this.setState({ contextMenuOpen: true });
    }

    render() {
        const {
            mode,
            // document
            brushes,
            // charPanel
            selectedBrush,
            randomizeBrush,
            flipBrushHorizontally,
            flipBrushVertically,
        } = this.props;

        return (
            <Fragment>
                <div>
                    <Checkbox inline={true} checked={randomizeBrush}
                        onChange={e => this.props.brushesUpdate({ randomizeBrush: !randomizeBrush })}
                        label="Randomize" />
                    <Checkbox inline={true} checked={flipBrushVertically}
                        onChange={e => this.props.brushesUpdate({ flipBrushVertically: !flipBrushVertically })}
                        label="Flip Y axis" />
                    <Checkbox inline={true} checked={flipBrushHorizontally}
                        onChange={e => this.props.brushesUpdate({ flipBrushHorizontally: !flipBrushHorizontally })}
                        label="Flip X axis" />
                </div>
                <Grid
                    height={150}
                    onCellClick={this.handleBrushClick}
                    onCellRightClick={this.handleBrushRightClick}
                    onCellDoubleClick={this.handleBrushDoubleClick}
                >
                    {mode === "brush" && brushes.map((brush, index) => {
                        const additionalClassNames = [];
                        if (index === selectedBrush) additionalClassNames.push('jq-grid-cell-selected');
                        return (
                            <GridCellBrush
                                brush={brush}
                                index={index}
                                key={`brush_${index}`}
                                additionalclassnames={additionalClassNames}
                            />
                        );
                    })}
                </Grid>
            </Fragment>

        );
    }
}

const mapStateToProps = (state) => ({
    brushes: state.document.brushes,
    selectedBrush: state.brushes.selectedBrush,
    mode: state.canvasUi.mode,
    randomizeBrush: state.brushes.randomizeBrush,
    flipBrushHorizontally: state.brushes.flipBrushHorizontally,
    flipBrushVertically: state.brushes.flipBrushVertically,
})

const mapDispatchToProps = {
    brushesUpdate,
    removeBrush
}

export default connect(mapStateToProps, mapDispatchToProps)(BrushesTab)
