import React from 'react';

// Style
import { Icon } from '@blueprintjs/core';

export const CrossIcon = () => {
    const style = {
        position: "absolute",
        zIndex: 0,
        color: "red",
    };

    return <Icon icon="cross" style={style} />
}