import React, { Component } from 'react'
import Grid from "../grids/Grid";
import GridCell from "../grids/GridCell";
import { cpixValuesToInt } from "../../../util/functions";

// Style
import { ContextMenu, Menu, MenuItem } from "@blueprintjs/core";

// Redux
import { connect } from 'react-redux';
import { update as charPanelUpdate } from '../../../redux/actions/charPanelActions';
import { addCharToPalette } from "../../../redux/actions/documentActions";

export class CharBrowserTab extends Component {
    state = {
        contextMenuOpen: false
    }

    handleCharClick = (e) => {
        if (e === null) return;
        const value = parseInt(e.target.getAttribute('data-value'));
        this.props.charPanelUpdate({ charBrowserSelection: value });
    }

    handleCharDoubleClick = (e) => { }

    handleCharRightClick = (e) => {
        if (e.target === null) return;

        const value = parseInt(e.target.getAttribute('data-value'));
        ContextMenu.show(
            (
                <Menu>
                    <MenuItem icon="add" onClick={e => this.props.addCharToPalette(value)} text="Add to Palette" />
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
            // document
            fonts, palette,
            // charPanel
            charBrowserSelection
        } = this.props;

        let browserCharCount = 0;
        const grids = fonts.map((fontName, fontIndex) => {
            if (fontName === undefined || fontName === null) return;
            const { glyphs } = window.fonts[fontName];
            return (
                <Grid
                    fontFamily={fontName}
                    title={fontName}
                    key={fontName}
                    onCellClick={this.handleCharClick}
                    onCellRightClick={this.handleCharRightClick}
                    onCellDoubleClick={this.handleCharDoubleClick}
                >
                    {glyphs.map((unicode) => {
                        const index = browserCharCount++;
                        const char = cpixValuesToInt(fontIndex, unicode);

                        const additionalClassNames = [];
                        if (char === charBrowserSelection) additionalClassNames.push('jq-grid-cell-selected')
                        else if (palette.indexOf(char) > 0) additionalClassNames.push('jq-grid-cell-on-palette')
                        return (
                            <GridCell
                                value={char}
                                index={index}
                                key={`char_browser_${index}`}
                                additionalclassnames={additionalClassNames}
                            >
                                {String.fromCharCode(unicode)}
                            </GridCell>
                        );
                    })}
                </Grid>
            )
        });

        return (
            <div style={{ maxHeight: 250, overflowY: "scroll" }}>
                {grids}
            </div>
        );
    }
}

const mapStateToProps = (state) => ({
    charBrowserSelection: state.charPanel.charBrowserSelection,
    palette: state.document.palette.char,
    fonts: state.document.fonts,
})

const mapDispatchToProps = {
    charPanelUpdate,
    addCharToPalette
}

export default connect(mapStateToProps, mapDispatchToProps)(CharBrowserTab)
