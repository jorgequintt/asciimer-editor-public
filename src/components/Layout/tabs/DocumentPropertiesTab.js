import React, { Component, Fragment } from 'react'
import Grid from "../grids/Grid";
import GridCell from "../grids/GridCell";
import Dialog from "../dialogs/Dialog";
import * as fontParser from "../../../util/fontParser";
import { cpixValuesToInt } from "../../../util/functions";

// Style
import {
    FileInput, Tag, Label, FormGroup, NumericInput, Classes, Intent, Divider,
    Alert, Button, EditableText, H3 as DocumentTitle
} from "@blueprintjs/core";

// Redux
import { connect } from 'react-redux'
import { update as documentUpdate, saveFont, removeFont } from "../../../redux/actions/documentActions";
import { update as documentPanelUpdate } from "../../../redux/actions/documentPanelActions";

export class DocumentPropertiesTab extends Component {
    state = {
        inner_ppb_value: null,
        inner_hblocks_value: null,
        inner_vblocks_value: null
    }

    handleNameChange = (e) => {
        this.props.documentUpdate({ name: e });
        // const name = e.target.value;
        // this.props.documentUpdate({ name: name });
    }

    handleNumericChange = (e) => {
        const value = parseInt(e.target.value);
        if (isNaN(value) || value < 1) return;
        const propertyName = e.target.id.replace("-input", "");
        this.props.documentUpdate({ [propertyName]: value });
        this.setState({ [`inner_${propertyName}_value`]: null });
    }

    handleNumericChangeByButton = (valAsInt, id) => {
        if (isNaN(valAsInt) || valAsInt < 1) return;
        this.props.documentUpdate({ [id]: valAsInt });
        this.setState({ [`inner_${id}_value`]: null });
    }

    handleFontRemove = () => {
        const fontName = this.props.fontRemoveRequest;
        this.props.removeFont(fontName);
        this.props.documentPanelUpdate({ fontRemoveRequest: null });
    }

    handleFontAdd = () => {
        this.props.saveFont(this.props.fontPreview);
        this.props.documentPanelUpdate({ fontPreview: null });
    }

    handleInputChange = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type.indexOf("ttf") > 0 || file.type.indexOf("otf") > 0) {
                const font_obj = await fontParser.loadFont(file);
                this.props.documentPanelUpdate({ fontPreview: font_obj.name });
            }
        }
    }

    handleFontInspect = (fontName) => {
        this.props.documentPanelUpdate({ fontInspect: fontName });
    }

    handleClosePreview = () => {
        fontParser.removeFont(this.props.fontPreview);
        this.props.documentPanelUpdate({ fontPreview: null });
    }

    render() {
        const {
            // document state
            documentName, hblocks, vblocks, ppb, fonts, created, layersCount,
            // documentPanel state
            fontInspect, fontPreview, fontRemoveRequest,
        } = this.props;

        const { inner_ppb_value, inner_hblocks_value, inner_vblocks_value } = this.state;

        const numericInputCommonProperties = {
            fill: true,
            min: 1,
            minorStepSize: 1,
            stepSize: 1,
            onBlur: this.handleNumericChange,
            onKeyDown: (e) => e.keyCode === 13 && this.handleNumericChange(e),
            onValueChange: (intVal, str, el) => {
                const propertyName = el.id.replace("-input", "");
                this.setState({ [`inner_${propertyName}_value`]: intVal });
            },
            // onValueChange: this.handleNumericChange,
            disabled: layersCount > 1 || !created,
        };

        return (
            <div style={{ padding: "5px" }}>

                <DocumentTitle>
                    <EditableText
                        onConfirm={this.handleNameChange}
                        placeholder={created ? "Project Name..." : "..."}
                        defaultValue={documentName}
                        onChange={this.handleNameChange}
                        value={documentName}
                        disabled={!created}
                        minWidth={400}
                        confirmOnEnterKey={true}
                    />
                </DocumentTitle>
                <br />
                <div style={{ display: "inline-flex", gap: "10px" }}>
                    <Label>
                        Horizontal Blocks
                        <NumericInput id="hblocks-input"
                            onButtonClick={(valueAsInt) => this.handleNumericChangeByButton(valueAsInt, "hblocks")}
                            value={inner_hblocks_value ?? hblocks} {...numericInputCommonProperties} />
                    </Label>
                    <Label>
                        Vertical Blocks
                        <NumericInput id="vblocks-input"
                            onButtonClick={(valueAsInt) => this.handleNumericChangeByButton(valueAsInt, "vblocks")}
                            value={inner_vblocks_value ?? vblocks} {...numericInputCommonProperties} />
                    </Label>
                    <Label>
                        Pixels Per Block
                        <NumericInput id="ppb-input"
                            onButtonClick={(valueAsInt) => this.handleNumericChangeByButton(valueAsInt, "ppb")}
                            value={inner_ppb_value ?? ppb} {...numericInputCommonProperties} stepSize={8} majorStepSize={8} />
                    </Label>
                </div>
                <FormGroup style={{ marginBottom: 0 }} label="Fonts">
                    <FileInput
                        disabled={!created}
                        text="Add a TTF or OTF font"
                        fill={true}
                        disabled={!created}
                        onInputChange={this.handleInputChange}
                    />
                    <Divider />
                    {fonts.map((fontName) => {
                        if (fontName === undefined || fontName === null) return;
                        return <Tag
                            intent={Intent.PRIMARY}
                            round={true}
                            minimal={true}
                            large={true}
                            round={true}
                            interactive={true}
                            key={fontName}
                            style={{ marginRight: 8, marginBottom: 6 }}
                            onRemove={(e) => {
                                e.stopPropagation();
                                this.props.documentPanelUpdate({ fontRemoveRequest: fontName });
                            }}
                            onClick={(e) => this.handleFontInspect(fontName)}
                        >
                            {fontName}
                        </Tag>
                    })}
                </FormGroup>

                <Alert
                    isOpen={fontRemoveRequest}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                    intent={Intent.DANGER}
                    icon="trash"
                    className={Classes.DARK}
                    onCancel={(e) => this.props.documentPanelUpdate({ fontRemoveRequest: null })}
                    onConfirm={this.handleFontRemove}
                >
                    Are you sure you want to remove font <i>{fontRemoveRequest}</i>? Every character in the
                    canvas will be erased.
                </Alert>

                <Dialog
                    title={`${fontInspect} Glyphs`}
                    isOpen={fontInspect}
                    onClose={(e) => this.props.documentPanelUpdate({ fontInspect: null })}
                    dialogBody={
                        fontInspect && (
                            <Grid
                                squared={true}
                                fontFamily={fontInspect}
                            >
                                {window.fonts[fontInspect]?.glyphs.map((unicode, index) => {
                                    return (
                                        <GridCell key={`font_inspect_${index}`} index={index}>
                                            {String.fromCharCode(unicode)}
                                        </GridCell>
                                    )
                                })}
                            </Grid>
                        )
                    }
                />

                <Dialog
                    title={`${fontPreview} Glyphs`}
                    important={true}
                    isOpen={fontPreview}
                    onClose={this.handleClosePreview}
                    dialogBody={
                        fontPreview && (
                            <Grid
                                squared={true}
                                fontFamily={fontPreview}
                            >
                                {window.fonts[fontPreview]?.glyphs.map((unicode, index) => {
                                    const value = cpixValuesToInt(fonts.indexOf(fontPreview), unicode);
                                    return (
                                        <GridCell value={value} key={`font_inspect_${index}`} index={index}>
                                            {String.fromCharCode(unicode)}
                                        </GridCell>
                                    )
                                })}
                            </Grid>
                        )
                    }

                    dialogFooterActions={
                        <Fragment>
                            <Button onClick={this.handleClosePreview}>Cancel</Button>
                            <Button intent={Intent.PRIMARY} onClick={this.handleFontAdd}>
                                Add Font
                            </Button>
                        </Fragment>
                    }
                />
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    // document
    documentName: state.document.name,
    hblocks: state.document.hblocks,
    vblocks: state.document.vblocks,
    ppb: state.document.ppb,
    fonts: state.document.fonts,
    created: state.document.created,
    layersCount: state.document.layers.length,
    // documentPanel
    fontInspect: state.documentPanel.fontInspect,
    fontPreview: state.documentPanel.fontPreview,
    fontRemoveRequest: state.documentPanel.fontRemoveRequest,

})

const mapDispatchToProps = {
    documentUpdate, documentPanelUpdate, removeFont, saveFont
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentPropertiesTab)
