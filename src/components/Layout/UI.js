import React, { Component, Fragment } from "react";
import NavBar from "./NavBar";
import Drawboard from "./Drawboard";
import Panels from "./Panels";

// Style
import { FocusStyleManager, Classes } from "@blueprintjs/core";
FocusStyleManager.onlyShowFocusOnTabs();

// Redux
import { connect } from "react-redux";
import { update as uiUpdate } from '../../redux/actions/uiActions';

export class UI extends Component {
    componentDidMount() {
        window.addEventListener('keydown', this.handleKeydown);
        window.addEventListener('keyup', this.handleKeyup);
    }

    handleKeydown = (e) => {
        if (e.keyCode === 16) this.props.uiUpdate({ shiftDown: true });
        if (e.keyCode === 17) this.props.uiUpdate({ ctrlDown: true });
        if (e.keyCode === 18) this.props.uiUpdate({ altDown: true });
    }

    handleKeyup = (e) => {
        if (e.keyCode === 16) this.props.uiUpdate({ shiftDown: false });
        if (e.keyCode === 17) this.props.uiUpdate({ ctrlDown: false });
        if (e.keyCode === 18) this.props.uiUpdate({ altDown: false });
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div onContextMenu={(e) => e.preventDefault()} className={Classes.DARK}>
                <NavBar />
                <Drawboard />
                <Panels />
            </div>
        );
    }
}

const mapDistpachToProps = {
    uiUpdate
};

export default connect(null, mapDistpachToProps)(UI);
