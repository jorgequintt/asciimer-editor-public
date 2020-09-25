import React, { Component } from 'react'
import ColorPicker from '../../small/ColorPicker';

// Style
import { Intent } from "@blueprintjs/core";

// Redux
import { connect } from 'react-redux'
import { update as colorPanelUpdate } from '../../../redux/actions/colorPanelActions';
import { addColorToPalette } from "../../../redux/actions/documentActions";

export class ColorBrowserTab extends Component {
    state = {
        colorSaved: false
    }

    handleColorChange = (color) => {
        this.props.colorPanelUpdate({ colorBrowserSelection: color.hex });
    }

    handleColorSubmit = () => {
        this.setState({ colorSaved: true });
        setTimeout(() => this.setState({ colorSaved: false }), 1200);
        this.props.addColorToPalette(this.props.colorBrowserSelection);
    }

    handleInputChange = (e) => {
        const value = e.currentTarget.value;
        if (/^#[a-fA-F0-9]{3,6}$/.test(value)) {
            this.props.colorPanelUpdate({ colorBrowserSelection: value });
        }
    }

    render() {
        const { colorBrowserSelection } = this.props;

        return <ColorPicker
            color={colorBrowserSelection ?? ""}
            onChange={this.handleColorChange}
            onInputChange={this.handleInputChange}
            onButtonClick={this.handleColorSubmit}
            buttonText={this.state.colorSaved ? "Color saved" : "Add Color"}
            buttonIntent={this.state.colorSaved ? Intent.SUCCESS : Intent.NONE}
        />
    }
}

const mapStateToProps = (state) => ({
    colorBrowserSelection: state.colorPanel.colorBrowserSelection,
})

const mapDispatchToProps = {
    colorPanelUpdate,
    addColorToPalette
}

export default connect(mapStateToProps, mapDispatchToProps)(ColorBrowserTab)
