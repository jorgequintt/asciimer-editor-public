import React, { Component, Fragment } from "react";
import { Card, Tabs, Tab, Tag, Icon } from "@blueprintjs/core";
import _ from 'lodash';

export class Panel extends Component {
    ref = React.createRef();
    offsets = { startx: 0, starty: 0 };
    state = {
        dragged: false,
    };

    handleClick = (e) => {
        // if (e.altKey) { e.stopPropagation(); e.preventDefault(); }
    }

    handleWindowDrag = (e) => {
        if (e.altKey) this.handleMouseDown(e);
    }

    handleMouseDown = (e) => {
        this.setState({ dragged: true });

        this.offsets.startx = e.clientX;
        // this.offsets.startx = e.clientX;
        this.offsets.starty = e.clientY;
        // this.offsets.starty = e.clientY;
        window.addEventListener("mousemove", this.dragWindow, true);
        window.addEventListener("mouseup", this.handleMouseUp, true);
        // window.addEventListener(
        //     "keyup",
        //     (e) => {
        //         if (e.altKey === false) this.handleMouseUp();
        //     },
        //     true
        // );
    }

    handleMouseUp = (e) => {
        this.setState({ dragged: false });
        window.removeEventListener("mousemove", this.dragWindow, true);
    }

    dragWindow = (e) => {
        const rect = {
            top: parseInt(this.ref.current.style.top.replace("px", "")),
            left: parseInt(this.ref.current.style.left.replace("px", "")),
        };

        // const rect = this.ref.current.getBoundingClientRect();
        const x = rect.left + (e.clientX - this.offsets.startx);
        this.offsets.startx = e.clientX; //x position within the element.

        const y = rect.top + (e.clientY - this.offsets.starty);
        this.offsets.starty = e.clientY; //y position within the element.

        this.ref.current.style.top = y + "px";
        this.ref.current.style.left = x + "px";
    }

    handleMouseOver = () => {
        this.ref.current.style.zIndex = 20;
    }
    handleMouseOut = () => {
        this.ref.current.style.zIndex = 19;
    }

    render() {
        const panelStyle = {
            position: "absolute",
            top: this.props.top ?? 70,
            left: this.props.left ?? 20,
            zIndex: 19,
            width: this.props.width,
        };

        const blueprintTabsProps = _.omit(this.props, ["top", "left", "width"])

        return (
            <div
                className={`jq-panel ${this.state.dragged ? "jq-move-cursor" : ""}`}
                onMouseDownCapture={this.handleWindowDrag}
                onClickCapture={this.handleClick}
                onMouseOver={this.handleMouseOver}
                onMouseOut={this.handleMouseOut}
                ref={this.ref}
                style={panelStyle}
            >
                <Card interactive={false} elevation={3} style={{ padding: "8px" }}>
                    <Tabs
                        {...blueprintTabsProps}
                        className={this.props.tabsSpaced && "tabsSpaced"}
                    >
                        {this.props.title && <Tag
                            className="jq-move-cursor"
                            large={true}
                            minimal={true}
                            fill={true}
                            onMouseDown={this.handleMouseDown}
                        >
                            {this.props.title}
                        </Tag>}
                        {this.props.children}

                        {(this.props.canMinimize !== false) &&
                            <Fragment>
                                <Tabs.Expander />
                                <Tab
                                    id={`minimize_${this.props.title}`}
                                    style={{ marginRight: 5 }}
                                    title={<Icon icon="minimize" />}
                                />
                            </Fragment>
                        }
                    </Tabs>
                </Card>
            </div>
        );
    }
}

export default Panel;
