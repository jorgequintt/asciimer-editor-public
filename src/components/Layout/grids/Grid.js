import React, { Component, Fragment } from "react";

// Style
import { H4 } from "@blueprintjs/core";

const actualCell = (e) => {
    let cell = e.target;
    if (!cell?.classList?.contains("jq-grid-cell")) cell = cell.closest("[class^='jq-grid-cell']");
    e.target = cell;
    return e;
}

export class Grid extends Component {
    grid = React.createRef();
    state = {
        calcFontSize: null,
    };

    componentDidMount() {
        const cell_width = this.grid.current.offsetWidth / 16;
        this.setState({ calcFontSize: cell_width - 10 });
    }

    render() {
        const {
            title,
            squared,
            height,
            fontFamily,
            onCellClick,
            onCellRightClick,
            onCellDoubleClick,
            children
        } = this.props;

        const gridStyle = { fontFamily: `${fontFamily && `"${fontFamily}", `} "Adobe Blank"` };
        if (this.state.calcFontSize) gridStyle.fontSize = this.state.calcFontSize;

        return (
            <Fragment>
                {title && <H4>{title}</H4>}
                <div
                    className={`jq-grid-wrapper ${squared || height ? "jq-square-grid" : ""}`}
                    style={height && { height }}
                >
                    <div
                        style={gridStyle}
                        ref={this.grid}
                        className="jq-grid"
                        onClick={(e) => onCellClick && onCellClick(actualCell(e))}
                        onContextMenu={(e) => onCellRightClick && onCellRightClick(actualCell(e))}
                        onDoubleClick={(e) => onCellDoubleClick && onCellDoubleClick(actualCell(e))}
                    >
                        {children}
                    </div>
                </div>
            </Fragment>
        );
    }
}

export default Grid;
