import React, { Component, Fragment } from 'react'
import Grid from "../grids/Grid";
import GridCell from "../grids/GridCell";
import Dialog from "../dialogs/Dialog";
import { CrossIcon } from '../../small/Atomic';
import { cpixIntToValues, cpixValuesToInt } from "../../../util/functions";

// Style
import { ContextMenu, Menu, MenuItem, Button, Intent } from "@blueprintjs/core";

// Redux
import { connect } from 'react-redux';
import { update as charPanelUpdate } from '../../../redux/actions/charPanelActions';
import { removeCharFromPalette, replaceCharFromPalette } from "../../../redux/actions/documentActions";

export class CharPaletteTab extends Component {
    state = {
        contextMenuOpen: false
    }

    handleCharClick = (e) => {
        if (e === null) return;
        const index = parseInt(e.target.getAttribute('data-index'));
        this.props.charPanelUpdate({ charPaletteSelection: index });
    }

    handleCharDoubleClick = (e) => { }

    handleCharRightClick = (e) => {
        if (e.target === null) return;

        const value = e.target.getAttribute('data-value');
        if (!value) teturn;

        const index = parseInt(e.target.getAttribute('data-index'));
        ContextMenu.show(
            (
                <Menu>
                    <MenuItem icon="font" onClick={e => this.props.charPanelUpdate({ charForReplacement: index })} text="Replace" />
                    <MenuItem icon="delete" onClick={e => this.props.removeCharFromPalette(index)} text="Remove" />
                </Menu>
            ),
            { top: e.clientY, left: e.clientX },
            (e) => this.setState({ contextMenuOpen: false }),
            true
        );
        this.setState({ contextMenuOpen: true });
    }

    handleReplaceCharClick = (e) => {
        if (e === null) return;
        const value = parseInt(e.target.getAttribute('data-value'));
        this.props.charPanelUpdate({ charReplacement: value });
    }

    handleReplaceCharSubmit = () => {
        const { charForReplacement, charReplacement } = this.props;
        this.props.replaceCharFromPalette(charForReplacement, charReplacement);
        this.props.charPanelUpdate({ charReplacement: null, charForReplacement: null });
    }

    handleCharReplaceDialogClose = () => {
        this.props.charPanelUpdate({ charReplacement: null, charForReplacement: null });
    }

    render() {
        const {
            // document
            fonts, palette,
            // charPanel
            charPaletteSelection, charForReplacement, charReplacement
        } = this.props;

        let replaceGrids;
        if (charForReplacement) {
            let replaceCharCount = 0;
            replaceGrids = fonts.map((fontName, fontIndex) => {
                const { glyphs } = window.fonts[fontName];
                return (
                    <Grid
                        fontFamily={fontName}
                        title={fontName}
                        key={fontName}
                        onCellClick={this.handleReplaceCharClick}
                    >
                        {glyphs.map((unicode) => {
                            const index = replaceCharCount++;
                            const char = cpixValuesToInt(fontIndex, unicode);

                            const additionalClassNames = [];
                            if (char === charReplacement) additionalClassNames.push('jq-grid-cell-selected')
                            else if (char === palette[charForReplacement]) additionalClassNames.push('jq-grid-cell-for-replacement')
                            else if (palette.indexOf(char) > 0) additionalClassNames.push('jq-grid-cell-on-palette')
                            return (
                                <GridCell
                                    value={char}
                                    index={index}
                                    key={`char_replace_${index}`}
                                    additionalclassnames={additionalClassNames}
                                >
                                    {String.fromCharCode(unicode)}
                                </GridCell>
                            );
                        })}
                    </Grid>
                )
            });
        }

        return (
            <Fragment>
                <Grid
                    onCellClick={this.handleCharClick}
                    onCellRightClick={this.handleCharRightClick}
                    onCellDoubleClick={this.handleCharDoubleClick}
                    height={250}
                >
                    {palette.map((char, index) => {
                        if (char === undefined) return;
                        let additionalClassNames = [];
                        if (index === charPaletteSelection) additionalClassNames.push("jq-grid-cell-selected");

                        const [fontFamilyIndex, unicode] = cpixIntToValues(char);
                        return (
                            <GridCell
                                value={char}
                                index={index}
                                key={`char_palette_${index}`}
                                additionalclassnames={additionalClassNames}
                                style={{ fontFamily: `"${fonts[fontFamilyIndex]}", "Adobe Blank"` }}
                            >
                                {index === 0 ? <CrossIcon /> : String.fromCharCode(unicode)}
                            </GridCell>
                        );
                    })}
                </Grid>
                <Dialog
                    isOpen={charForReplacement}
                    title="Replace palette char"
                    important={true}
                    onClose={this.handleCharReplaceDialogClose}
                    dialogBody={
                        <div style={{ maxHeight: 400, overflowY: "scroll" }}>
                            {replaceGrids}
                        </div>
                    }
                    dialogFooterActions={
                        <Fragment>
                            <Button onClick={this.handleCharReplaceDialogClose}>
                                Cancel
                            </Button>
                            <Button disabled={!charReplacement} intent={Intent.PRIMARY} onClick={this.handleReplaceCharSubmit}>
                                Replace Char
                            </Button>
                        </Fragment>
                    }
                />
            </Fragment>
        )
    }
}

const mapStateToProps = (state) => ({
    charPaletteSelection: state.charPanel.charPaletteSelection,
    charForReplacement: state.charPanel.charForReplacement,
    charReplacement: state.charPanel.charReplacement,
    palette: state.document.palette.char,
    fonts: state.document.fonts,
})

const mapDispatchToProps = {
    charPanelUpdate,
    removeCharFromPalette,
    replaceCharFromPalette
}

export default connect(mapStateToProps, mapDispatchToProps)(CharPaletteTab)
