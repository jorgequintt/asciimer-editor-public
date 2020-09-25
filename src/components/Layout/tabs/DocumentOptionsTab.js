import React, { Component, Fragment } from 'react'

// Style
import { Tag, Label, Switch, } from "@blueprintjs/core";

// Redux
import { connect } from 'react-redux'
import { update as optionsUpdate } from "../../../redux/actions/optionsActions";

export class DocumentOptionsTab extends Component {

    handleSwitchChange = (type) => {
        this.props.optionsUpdate({ [type]: !this.props[type] })
    }

    render() {
        const {
            isolateSelectedLayer,
            bringSelectedLayerToFront,
            grayOutUnfocusedLayers,
        } = this.props;

        return (
            <div style={{ padding: "5px" }}>
                <Label>
                    Options
                </Label>
                <Switch checked={isolateSelectedLayer} label="Hide unfocused layer" large={true} onChange={e => this.handleSwitchChange("isolateSelectedLayer")} />
                <Switch checked={grayOutUnfocusedLayers} label="Gray out unfocused layers" large={true} onChange={e => this.handleSwitchChange("grayOutUnfocusedLayers")} />
                <Switch checked={bringSelectedLayerToFront} label="Bring focused layer to top" large={true} onChange={e => this.handleSwitchChange("bringSelectedLayerToFront")} />
            </div>
        )
    }
}

const mapStateToProps = (state) => ({
    isolateSelectedLayer: state.options.isolateSelectedLayer,
    bringSelectedLayerToFront: state.options.bringSelectedLayerToFront,
    grayOutUnfocusedLayers: state.options.grayOutUnfocusedLayers,
})

const mapDispatchToProps = {
    optionsUpdate
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentOptionsTab)
