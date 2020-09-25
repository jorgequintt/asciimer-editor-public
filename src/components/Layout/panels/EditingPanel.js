import React, { Component, Fragment } from "react";
import Panel from "./Panel";
import BrushesTab from '../tabs/BrushesTab';

// Style
import { Tab, Icon, Label, Classes, HTMLSelect, Tooltip, Position, Intent } from "@blueprintjs/core";

// Redux
import { connect } from "react-redux";
import { update as canvasUiUpdate, changeMode } from '../../../redux/actions/canvasUiActions';

export class EditingPanel extends Component {
    handleTabChange = (tabId) => {
        this.props.changeMode(tabId);
    }

    handleFontChange = (e) => {
        const newFont = e.currentTarget.value;
        if (newFont === "0") {
            this.props.canvasUiUpdate({ textModeFont: 0 });
        } else {
            const newIndex = this.props.fonts.indexOf(newFont);
            this.props.canvasUiUpdate({ textModeFont: newIndex });
        }
    }

    render() {
        const { selectedLayer, fonts, textModeFont, mode } = this.props;

        const selectOptions = [
            { label: "Choose a font", value: 0 },
            ...fonts.filter(f => !!f).map((f) => ({
                value: f
            }))
        ];
        const textTab = <div>
            <HTMLSelect options={selectOptions} onChange={this.handleFontChange} fill={true} value={textModeFont && fonts[textModeFont]} />
        </div>
        return (
            <Panel
                canMinimize={false}
                width={this.props.width}
                top={this.props.top}
                left={this.props.left}
                onChange={this.handleTabChange}
                defaultTabId={mode}
                selectedTabId={mode}
                tabsSpaced={true}
            >
                <Tab disabled={!selectedLayer || fonts.length === 0} id="draw" title={
                    <Tooltip content="Draw Mode" className={Classes.DARK} position={Position.TOP}>
                        <Icon icon="draw" iconSize={26} intent={mode === "draw" ? Intent.PRIMARY : Intent.NONE} />
                    </Tooltip>
                } panel={undefined} />
                <Tab disabled={!selectedLayer} id="color" title={
                    <Tooltip content="Color Mode" className={Classes.DARK} position={Position.TOP}>
                        <Icon icon="tint" iconSize={26} intent={mode === "color" ? Intent.PRIMARY : Intent.NONE} />
                    </Tooltip>
                } panel={undefined} />
                <Tab disabled={!selectedLayer || fonts.length === 0} id="brush" title={
                    <Tooltip content="Brush Mode" className={Classes.DARK} position={Position.TOP}>
                        <Icon icon="style" iconSize={26} intent={mode === "brush" ? Intent.PRIMARY : Intent.NONE} />
                    </Tooltip>
                } panel={<BrushesTab />} />
                <Tab disabled={!selectedLayer || fonts.length === 0} id="text" title={
                    <Tooltip content="Text Mode" className={Classes.DARK} position={Position.TOP}>
                        <Icon icon="paragraph" iconSize={26} intent={mode === "text" ? Intent.PRIMARY : Intent.NONE} />
                    </Tooltip>
                } panel={textTab} />
                <Tab disabled={!selectedLayer} id="select" title={
                    <Tooltip content="Selection Mode" className={Classes.DARK} position={Position.TOP}>
                        <Icon icon="select" iconSize={26} intent={mode === "select" ? Intent.PRIMARY : Intent.NONE} />
                    </Tooltip>
                } panel={undefined} />
                <Tab disabled={!selectedLayer} id="erase" title={
                    <Tooltip content="Erase Mode" className={Classes.DARK} position={Position.TOP}>
                        <Icon icon="eraser" iconSize={26} intent={mode === "erase" ? Intent.PRIMARY : Intent.NONE} />
                    </Tooltip>
                } panel={undefined} />
            </Panel>
        );
    }
}


const mapStateToProps = (state) => ({
    mode: state.canvasUi.mode,
    selectedLayer: state.documentPanel.selectedLayer,
    fonts: state.document.fonts,
    textModeFont: state.canvasUi.textModeFont
});

const mapActionsToProps = {
    canvasUiUpdate,
    changeMode
};

export default connect(mapStateToProps, mapActionsToProps)(EditingPanel);
