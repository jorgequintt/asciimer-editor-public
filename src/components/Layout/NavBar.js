import React, { Component, Fragment } from "react";
import { mainToaster } from "../../util/toaster";
import Dialog from "./dialogs/Dialog";

// Style 
import {
    Navbar, Button, Alignment, Menu, Classes, Intent,
    H1, H2, H3, H4, H5, Divider, HTMLTable
} from "@blueprintjs/core";

// Redux 
import { connect } from "react-redux";
import { exportDocument, saveDocument, loadDocument } from "../../redux/actions/documentActions";
import { update as uiUpdate } from "../../redux/actions/uiActions";


export class NavBar extends Component {
    inputRef = React.createRef();

    handleInputClick = (e) => {
        this.inputRef.current.click();
    }

    handleProjectLoad = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.name.indexOf(".aep") > 0) {
                const filereader = new FileReader();
                filereader.onload = (data) => {
                    this.props.loadDocument(data.currentTarget.result);
                };
                filereader.readAsText(file);
            } else {
                mainToaster.show({ message: "Not a valid file type", intent: Intent.DANGER, timeout: 4000 });
            }
        }
    }

    render() {
        const openMenu = (
            <Menu>
                <Menu.Item text="Open file" />
                <Menu.Item text="Open from local storage" />
            </Menu>
        );

        return (
            <Fragment>
                <Navbar>
                    <Navbar.Group align={Alignment.LEFT}>
                        <Navbar.Heading>ASCIIMER </Navbar.Heading>
                        <Navbar.Divider />

                        <Button icon="floppy-disk" className={Classes.MINIMAL} disabled={!this.props.created}
                            onClick={this.props.saveDocument}
                            text="Save Project" />
                        <div style={{ display: "none" }} >
                            <input id="jq-project-load-input" type="file" ref={this.inputRef} onChange={this.handleProjectLoad} />
                        </div>
                        <Button icon="folder-open" className={Classes.MINIMAL}
                            onClick={this.handleInputClick}
                            text="Load Project" />
                        <Button icon="media" className={Classes.MINIMAL} disabled={!this.props.created}
                            onClick={this.props.exportDocument}
                            text="Export Image" />
                        <Button icon="help" className={Classes.MINIMAL} intent={Intent.SUCCESS}
                            onClick={e => this.props.uiUpdate({ helpOpen: true })}
                            text="Help" />

                    </Navbar.Group>
                </Navbar>
                <Dialog
                    isOpen={this.props.helpOpen}
                    title="Help"
                    important={false}
                    onClose={e => this.props.uiUpdate({ helpOpen: false })}
                    dialogBody={<Fragment>
                        <h1 style={{ textAlign: "center" }}>Asciimer</h1>
                        <p style={{ marginBottom: 30, textAlign: "center" }}>Made by <a href="https://jorgequintt.site">Jorge Quintero</a>. All rights reserved.</p>
                        <H3>Quickstart</H3>
                        <ul>
                            <li>Load a .ttf or .otf font (Or use the default one)</li>
                            <li>Create a layer</li>
                            <li>Choose a character and a color</li>
                            <li>Start drawing</li>
                        </ul>
                        <H3 style={{ marginTop: 20 }}>Shortcuts</H3>
                        <HTMLTable style={{ width: "100%" }} className="jq-shortcuts-table" condensed={false} striped={true} bordered={true}>
                            <tbody style={{ height: 200, maxHeight: 200, overflowY: "scroll" }}>
                                <H4>General</H4>
                                <tr><td>Download Project</td><td>Ctrl + S</td></tr>
                                <tr><td>Load Project</td><td>Ctrl + O</td></tr>
                                <tr><td>Undo</td><td>Ctrl + Z</td></tr>
                                <tr><td>Redo</td><td>Ctrl + Y</td></tr>
                                <tr><td>Move Panel</td><td>Alt + Click</td></tr>
                                <H4>Editing</H4>
                                <tr><td>Drawing Mode</td><td>Ctrl + 1 / D</td></tr>
                                <tr><td>Color Mode</td><td>Ctrl + 2 / C</td></tr>
                                <tr><td>Text Mode</td><td>Ctrl + 3 / T</td></tr>
                                <tr><td>Brush Mode</td><td>Ctrl + 4 / B</td></tr>
                                <tr><td>Select Mode</td><td>Ctrl + 5 / S</td></tr>
                                <tr><td>Erase Mode</td><td>Ctrl + 6 / E</td></tr>
                                <tr><td>Change Char</td><td>Scroll (X and Y Axis)</td></tr>
                                <tr><td>Change Fg Color</td><td> Shift + Scroll (X and Y Axis)</td></tr>
                                <tr><td>Change Bg Color</td><td> Ctrl + Scroll (X and Y Axis)</td></tr>
                            </tbody>
                        </HTMLTable>
                    </Fragment>}
                    dialogFooterActions={
                        <Button onClick={e => this.props.uiUpdate({ helpOpen: false })}>Close</Button>
                    }
                />
            </Fragment>

        );
    }
}

const mapStateToProps = (state) => ({
    created: state.document.created,
    helpOpen: state.ui.helpOpen,
})

const mapDispatchToProps = {
    exportDocument,
    saveDocument,
    loadDocument,
    uiUpdate,
}

export default connect(mapStateToProps, mapDispatchToProps)(NavBar);
