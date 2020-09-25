import React, { Component, Fragment } from 'react';
import Dialog from "../dialogs/Dialog";

// Style
import {
    Card, Button, Icon, EditableText, Divider, H5 as LayerTitle,
    Intent, Alert, Classes, Label, NumericInput
} from '@blueprintjs/core';

// Redux
import { connect } from 'react-redux';
import { updateLayer, moveLayer, duplicateLayer, deleteLayer, createLayer } from "../../../redux/actions/documentActions";
import { update as documentPanelUpdate, selectLayer } from "../../../redux/actions/documentPanelActions";

export class LayersTab extends Component {
    state = {
        deleteDialogOpen: false,
        editDialogOpen: false,
        editDialogProperties: {}
    }

    handleLayerNameChange = (id, name) => {
        this.props.updateLayer(id, { name })
    }

    changeLayerVisibility = () => {
        const selected = this.props.selectedLayer;
        const visible = this.props.layers[selected].visible;
        this.props.updateLayer(selected, { visible: !visible })
    }

    handleLayerClick = (id) => {
        this.props.selectLayer(id);
    }

    moveLayerDown = () => {
        const { layers, selectedLayer, layerNames } = this.props;
        const newIndex = layers[selectedLayer].index + 1;
        if (newIndex >= layerNames.length) return;
        this.props.moveLayer(selectedLayer, newIndex);
    }

    moveLayerUp = () => {
        const { layers, selectedLayer } = this.props;
        const newIndex = layers[selectedLayer].index - 1;
        if (newIndex < 0) return;
        this.props.moveLayer(selectedLayer, newIndex);
    }

    moveLayerToTop = () => {
        const { layers, selectedLayer } = this.props;
        if (layers[selectedLayer].index === 0) return;
        this.props.moveLayer(selectedLayer, 0);
    }

    moveLayerToBottom = () => {
        const { layers, selectedLayer, layerNames } = this.props;
        if (layers[selectedLayer].index === layerNames.length - 1) return;
        this.props.moveLayer(selectedLayer, layerNames.length - 1);
    }

    duplicateSelectedLayer = () => {
        this.props.duplicateLayer(this.props.selectedLayer);
    }

    deleteSelectedLayer = () => {
        this.props.deleteLayer(this.props.selectedLayer);
        this.props.documentPanelUpdate({ selectedLayer: null });
        this.setState({ deleteDialogOpen: false });
    }

    openLayerPropertiesDialog = () => {
        const selectedLayer = this.props.selectedLayer;
        const { text_weight, text_margin, resolution, cpc } = this.props.layers[selectedLayer];
        this.setState({
            editDialogProperties: {
                text_weight, text_margin, resolution, cpc
            },
            editDialogOpen: true
        });
    }

    closeLayerPropertiesDialog = () => {
        this.setState({
            editDialogProperties: {},
            editDialogOpen: false
        });
    }

    saveLayerProperties = () => {
        this.props.updateLayer(this.props.selectedLayer, this.state.editDialogProperties);
        this.closeLayerPropertiesDialog();
    }

    createNewLayer = () => {
        this.props.createLayer();
        // const maxIndex = this.props.layerNames.length - 1;
        // const id = Object.entries(this.props.layers).find(l => l[1].index === maxIndex)[0];
        // this.props.documentPanelUpdate({ selectedLayer: id });
        // this.openLayerPropertiesDialog();
    }

    render() {
        const { layers, selectedLayer } = this.props;

        const iconsByLayerType = {
            "image": "media",
            "text": "font"
        };
        const layersArr = Object.entries(layers).sort((a, b) => a[1].index - b[1].index);
        const buttonProperties = { large: true, disabled: !selectedLayer, minimal: true, intent: (selectedLayer ? Intent.PRIMARY : Intent.NONE) };
        return (
            <Fragment>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0px 0px 16px 0px" }}>
                    <Button {...buttonProperties} intent={Intent.SUCCESS} disabled={false} onClick={this.createNewLayer} icon="add" />
                    <Divider />
                    <Button {...buttonProperties} onClick={this.moveLayerUp} icon="chevron-up" />
                    <Button {...buttonProperties} onClick={this.moveLayerDown} icon="chevron-down" />
                    <Button {...buttonProperties} onClick={this.moveLayerToTop} icon="double-chevron-up" />
                    <Button {...buttonProperties} onClick={this.moveLayerToBottom} icon="double-chevron-down" />
                    <Divider />
                    <Button {...buttonProperties} onClick={this.openLayerPropertiesDialog} icon="edit" />
                    <Button {...buttonProperties} onClick={this.changeLayerVisibility} icon="eye-open" />
                    <Button {...buttonProperties} onClick={this.duplicateSelectedLayer} icon="duplicate" />
                    <Button {...buttonProperties} intent={Intent.DANGER} onClick={() => this.setState({ deleteDialogOpen: true })} icon="trash" />
                </div>
                <div style={{ maxHeight: 300, overflowY: "scroll" }}>
                    {layersArr.map(([layerId, layer]) => {
                        const cardStyle = { margin: "8px 5px", boxSizing: "border-box", cursor: "pointer", opacity: 1 };
                        if (layerId === selectedLayer) {
                            cardStyle.background = "#137cbd";
                            cardStyle.color = "#ffffff";
                        }
                        if (!layer.visible) {
                            cardStyle.opacity = 0.20;
                        }
                        return <Card key={layerId} elevation={2}
                            onClick={e => this.handleLayerClick(layerId)}
                            onDoubleClick={this.openLayerPropertiesDialog}
                            style={cardStyle}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <div style={{ width: 260 }}>
                                    <LayerTitle>
                                        <EditableText minWidth={220} defaultValue={layer.name}
                                            // onChange={newName => this.handleLayerNameChange(layerId, newName)}
                                            confirmOnEnterKey={true}
                                            onConfirm={newName => this.handleLayerNameChange(layerId, newName)}
                                        />
                                    </LayerTitle>

                                </div>
                                <div style={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                                    <Icon icon={iconsByLayerType[layer.type]} iconSize={18} color={layerId === selectedLayer ? "white" : "gray"} />
                                </div>
                            </div>
                        </Card>
                    })}
                </div>
                <Alert
                    isOpen={this.state.deleteDialogOpen}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                    intent={Intent.DANGER}
                    icon="trash"
                    className={Classes.DARK}
                    onCancel={(e) => this.setState({ deleteDialogOpen: false })}
                    onConfirm={this.deleteSelectedLayer}
                >
                    Are you sure you want to delete layer <i>{layers[selectedLayer]?.name}</i>?
                </Alert>
                <Dialog
                    title={`Layer Properties`}
                    isOpen={this.state.editDialogOpen}
                    onClose={this.closeLayerPropertiesDialog}
                    dialogBody={
                        <Fragment>
                            <Label>
                                Layer cpixs margin
                                <NumericInput value={this.state.editDialogProperties.text_margin} min={0}
                                    onValueChange={num => this.setState({
                                        editDialogProperties: { ...this.state.editDialogProperties, text_margin: num }
                                    })}
                                />
                            </Label>
                            <Label>
                                Layer cpixs weight
                                <NumericInput value={this.state.editDialogProperties.text_weight} min={100} max={900}
                                    stepSize={100} majorStepSize={100}
                                    onValueChange={num => this.setState({
                                        editDialogProperties: { ...this.state.editDialogProperties, text_weight: num }
                                    })}
                                />
                            </Label>
                            <Label>
                                Layer characters per cell
                                <NumericInput value={this.state.editDialogProperties.cpc} min={1} max={2} stepSize={1}
                                    onValueChange={num => this.setState({
                                        editDialogProperties: { ...this.state.editDialogProperties, cpc: num }
                                    })}
                                />
                            </Label>
                            <Label>
                                Layer resolution per block (chars per axis in block)
                                <NumericInput value={this.state.editDialogProperties.resolution} min={4} stepSize={4} majorStepSize={4}
                                    onValueChange={num => this.setState({
                                        editDialogProperties: { ...this.state.editDialogProperties, resolution: num }
                                    })}
                                />
                            </Label>
                        </Fragment>
                    }
                    dialogFooterActions={
                        <Fragment>
                            <Button onClick={this.closeLayerPropertiesDialog}>Cancel</Button>
                            <Button intent={Intent.PRIMARY} onClick={this.saveLayerProperties}>
                                Save Layer
                            </Button>
                        </Fragment>
                    }
                />
            </Fragment>
        )
    }
}

const mapStateToProps = (state) => ({
    selectedLayer: state.documentPanel.selectedLayer,
    layers: state.document.layers,
    // subscription
    layerNames: Object.values(state.document.layers).map(l => l.name)
})

const mapDispatchToProps = {
    updateLayer,
    moveLayer,
    documentPanelUpdate,
    duplicateLayer,
    deleteLayer,
    createLayer,
    selectLayer
}

export default connect(mapStateToProps, mapDispatchToProps)(LayersTab)
