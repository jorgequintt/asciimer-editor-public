import React, { Component } from 'react'
import { ChromePicker } from "react-color";

// Style
import { Classes, Button } from "@blueprintjs/core";

export class ColorPicker extends Component {
    render() {
        const { onInputChange, onButtonClick, buttonText, buttonIntent, comparisonColor } = this.props;
        const chromePickerProps = _.omit(this.props, ["onInputChange", "onButtonClick", "buttonText", "buttonIntent"]);

        const colorPreviewStyle = {
            width: "100%",
            height: 20,
            marginBottom: 8,
        };


        return (
            <div>
                <ChromePicker
                    disableAlpha={true}
                    className={Classes.DARK}
                    styles={{ width: "100%" }}
                    {...chromePickerProps}
                />
                <div className={Classes.DIALOG_FOOTER}>
                    {comparisonColor && <div style={{ ...colorPreviewStyle, backgroundColor: comparisonColor }} />}
                    <div style={{ ...colorPreviewStyle, backgroundColor: chromePickerProps.color }} />
                    <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <input
                            onChange={onInputChange}
                            value={chromePickerProps.color}
                            className={Classes.INPUT}
                            disabled={!chromePickerProps.color}
                            style={{ flexGrow: 1 }}
                        />
                        <Button
                            disabled={!chromePickerProps.color}
                            intent={buttonIntent}
                            onClick={onButtonClick}
                        >
                            {buttonText}
                        </Button>
                    </div>
                </div>
            </div>
        )
    }
}

export default ColorPicker;
