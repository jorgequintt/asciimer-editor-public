import React from 'react';
import _ from 'lodash';

export const GridCell = (props) => {
    const { value, index, additionalclassnames, children } = props;
    const otherProps = _.omit(props, ["value", "index", "additionalclassnames", "children"])

    const className = ["jq-grid-cell", ...(additionalclassnames ?? [])].join(" ");

    return (
        <div data-value={value} data-index={index} className={className} {...otherProps}>
            {children}
        </div>
    )
}

export default GridCell;