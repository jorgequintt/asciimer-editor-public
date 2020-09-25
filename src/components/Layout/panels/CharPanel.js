import React, { Component, Fragment } from "react";
import Panel from "./Panel";
import CharPaletteTab from "../tabs/CharPaletteTab";
import CharBrowserTab from "../tabs/CharBrowserTab";

// Style
import { Tab } from "@blueprintjs/core";

// Redux
import { connect } from "react-redux";
import { update as charPanelUpdate } from "../../../redux/actions/charPanelActions";

export class CharsPanel extends Component {

    handleTabChange = (tabId) => {
        this.props.charPanelUpdate({ selectedTab: tabId })
    }

    render() {
        return (
            <Panel
                title="Characters"
                width={this.props.width}
                top={this.props.top}
                left={this.props.left}
                defaultTabId={this.props.selectedTab}
                selectedTabId={this.props.selectedTab}
                onChange={this.handleTabChange}
            >
                <Tab id="char_palette" disabled={!this.props.created} title="Palette" panel={<CharPaletteTab />} />
                <Tab id="char_browser" disabled={!this.props.created} title="Browser" panel={<CharBrowserTab />} />
            </Panel>
        );
    }
}

const mapActionsToProps = {
    charPanelUpdate
};

const mapStateToProps = (state) => ({
    created: state.document.created,
    selectedTab: state.charPanel.selectedTab,
});

export default connect(mapStateToProps, mapActionsToProps)(CharsPanel);
