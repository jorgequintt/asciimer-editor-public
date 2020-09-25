import React, { Component, Fragment } from 'react';
import Grid from '../grids/Grid';
import GridCell from '../grids/GridCell';
import Dialog from '../dialogs/Dialog';
import { CrossIcon } from '../../small/Atomic';
import ColorPicker from '../../small/ColorPicker';

// Style
import { ContextMenu, Menu, MenuItem } from '@blueprintjs/core';

// Redux
import { connect } from 'react-redux'
import { removeColorFromPalette, replaceColorFromPalette } from '../../../redux/actions/documentActions';
import { update as colorPanelUpdate } from '../../../redux/actions/colorPanelActions';

export class ColorPaletteTab extends Component {
    state = {
        contextMenuOpen: false
    }

    handleColorClick = (e) => {
        if (e.target === null) return;

        const type = e.ctrlKey ? "bg" : "fg";
        const index = e.target.getAttribute('data-index');
        this.props.colorPanelUpdate({ [`${type}Selection`]: parseInt(index) });
    }

    handleColorRightClick = (e) => {
        if (e.target === null) return;

        const value = e.target.getAttribute('data-value');
        if (!value) return;

        const index = parseInt(e.target.getAttribute('data-index'));
        ContextMenu.show(
            (
                <Menu>
                    <MenuItem icon="font"
                        onClick={e => this.props.colorPanelUpdate({ colorForReplacement: index })}
                        text="Replace"
                    />
                    <MenuItem icon="delete" onClick={e => this.props.removeColorFromPalette(index)} text="Remove" />
                </Menu>
            ),
            { top: e.clientY, left: e.clientX },
            (e) => this.setState({ contextMenuOpen: false }),
            true
        );
        this.setState({ contextMenuOpen: true });
    }

    handleColorDoubleClick = (e) => {
    }

    handleReplaceColorChange = (color) => {
        this.props.colorPanelUpdate({ colorReplacement: color.hex })
    }

    handleReplaceColorSubmit = () => {
        const { colorForReplacement, colorReplacement } = this.props;
        this.props.replaceColorFromPalette(colorForReplacement, colorReplacement);
        this.props.colorPanelUpdate({ colorReplacement: null, colorForReplacement: null });
    }

    handleReplaceColorInputChange = (e) => {
        const value = e.currentTarget.value;
        if (/^#[a-fA-F0-9]{3,6}$/.test(value)) {
            this.props.colorPanelUpdate({ colorBrowserSelection: value });
        }
    }

    render() {
        const { palette, fgSelection, bgSelection, colorForReplacement, colorReplacement } = this.props;

        return (
            <Fragment>

                <Grid
                    onCellClick={this.handleColorClick}
                    onCellRightClick={this.handleColorRightClick}
                    onCellDoubleClick={this.handleColorDoubleClick}
                    height={200}
                >
                    {palette.map((color, index) => {
                        if (color === undefined) return;

                        let additionalClassNames = [];
                        if (index === fgSelection) additionalClassNames.push("fg");
                        if (index === bgSelection) additionalClassNames.push("bg");
                        if (additionalClassNames.length > 0) additionalClassNames.push("jq-grid-cell-selected");

                        return (
                            <GridCell
                                value={color}
                                index={index}
                                key={`color_palette_${index}`}
                                additionalclassnames={additionalClassNames}
                                style={{ backgroundColor: color }}
                            >
                                {color === null && <CrossIcon />}
                            </GridCell>
                        );
                    })}
                </Grid>
                <Dialog
                    isOpen={colorForReplacement}
                    important={true}
                    title="Replace palette color"
                    onClose={(e) => this.props.colorPanelUpdate({ colorForReplacement: null })}
                    dialogBody={
                        <ColorPicker
                            color={colorReplacement ?? ""}
                            comparisonColor={palette[colorForReplacement]}
                            onChange={this.handleReplaceColorChange}
                            onInputChange={this.handleReplaceColorInputChange}
                            onButtonClick={this.handleReplaceColorSubmit}
                            buttonText="Replace Color"
                        />
                    }
                />
            </Fragment>
        )
    }
}

const mapStateToProps = (state) => ({
    palette: state.document.palette.color,
    fgSelection: state.colorPanel.fgSelection,
    bgSelection: state.colorPanel.bgSelection,
    colorForReplacement: state.colorPanel.colorForReplacement,
    colorReplacement: state.colorPanel.colorReplacement,
})

const mapDispatchToProps = {
    colorPanelUpdate,
    removeColorFromPalette,
    replaceColorFromPalette
}

export default connect(mapStateToProps, mapDispatchToProps)(ColorPaletteTab)
