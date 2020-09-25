import React, { Component, Fragment } from "react";
import DocumentPropertiesTab from '../tabs/DocumentPropertiesTab';
import DocumentLayersTab from '../tabs/DocumentLayersTab';
import DocumentOptionsTab from "../tabs/DocumentOptionsTab";

// Style
import Panel from "./Panel";
import { Tab } from "@blueprintjs/core";

// Redux
import { connect } from "react-redux";
import { update as documentPanelupdate } from '../../../redux/actions/documentPanelActions';

export class DocumentPanel extends Component {

    handleTabChange = (tabId) => {
        this.props.documentPanelupdate({ selectedTab: tabId });
    }

    render() {
        const { created, selectedTab } = this.props;

        return (
            <Panel
                width={this.props.width}
                top={this.props.top}
                left={this.props.left}
                onChange={this.handleTabChange}
                defaultSelectedTabId={selectedTab}
                selectedTabId={selectedTab}
                renderActiveTabPanelOnly={true}
                title="Document"
                defaultTabId="doc_properties"
            >
                <Tab id="doc_properties" title="Properties" panel={<DocumentPropertiesTab />} />
                <Tab id="doc_layers" title="Layers" disabled={!created} panel={<DocumentLayersTab />} />
                <Tab id="doc_options" title="Options" disabled={!created} panel={<DocumentOptionsTab />} />
            </Panel>
        );
    }
}

const mapStateToProps = (state) => ({
    created: state.document.created,
    selectedTab: state.documentPanel.selectedTab,
});

const mapDispatchToProps = {
    documentPanelupdate
};

export default connect(mapStateToProps, mapDispatchToProps)(DocumentPanel);
