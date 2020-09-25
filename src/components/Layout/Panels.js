import React, { Component, Fragment } from "react";
import DocumentPanel from "./panels/DocumentPanel";
import CharPanel from "./panels/CharPanel";
import ColorPanel from "./panels/ColorPanel";
import EditingPanel from "./panels/EditingPanel";

export class Panels extends Component {
    render() {
        return (
            <Fragment>
                <DocumentPanel width={400} top={70} left={30} />
                <CharPanel width={400} top={40} left={window.innerWidth - 430} />
                <ColorPanel width={400} top={380} left={window.innerWidth - 430} />
                <EditingPanel width={400} top={510} left={30} />
            </Fragment>
        );
    }
}

export default Panels;
