import React, { Component, Fragment } from "react";
import Panel from "./Panel";
import ColorPaletteTab from "../tabs/ColorPaletteTab";
import ColorBrowserTab from "../tabs/ColorBrowserTab";

// Style
import { Tab } from "@blueprintjs/core";

// Redux
import { connect } from "react-redux";
import { update as colorPanelUpdate } from '../../../redux/actions/colorPanelActions';

export class ColorPanel extends Component {
    handleTabChange = (tabId) => {
        this.props.colorPanelUpdate({ selectedTab: tabId });
    }

    render() {
        return (
            <Panel
                title="Colors"
                width={this.props.width}
                top={this.props.top}
                left={this.props.left}
                onChange={this.handleTabChange}
                defaultTabId={this.props.selectedTab}
                selectedTabId={this.props.selectedTab}
            >
                <Tab id="color_palette" disabled={!this.props.created} title="Palette" panel={<ColorPaletteTab />} />
                <Tab id="color_browser" disabled={!this.props.created} title="Browser" panel={<ColorBrowserTab />} />
            </Panel>
        );
    }
}


const mapStateToProps = (state) => ({
    selectedTab: state.colorPanel.selectedTab,
    created: state.document.created,
});

const mapActionsToProps = {
    colorPanelUpdate
};

export default connect(mapStateToProps, mapActionsToProps)(ColorPanel);
