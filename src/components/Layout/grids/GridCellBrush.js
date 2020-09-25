import React, { Component } from 'react';
import _ from 'lodash';
import { intToValues, cpixIntToValues } from '../../../util/functions';

// Redux
import { connect } from 'react-redux';

export class GridCellBrush extends Component {
    render() {
        const { brush, index, additionalclassnames, char_palette, color_palette, fonts } = this.props;
        const otherProps = _.omit(this.props, ["index", "dispatch", "brush", "char_palette", "color_palette", "fonts", "additionalclassnames", "children"]);

        const className = ["jq-grid-cell-brush", ...(additionalclassnames ?? [])].join(" ");
        const charSize = 60 / Math.max(brush.length, brush[0].length);

        // Draw
        const canv = document.createElement('canvas');
        canv.width = charSize * brush[0].length;
        canv.height = charSize * brush.length;
        const ctx = canv.getContext('2d');
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        for (let y = 0; y < brush.length; y++) {
            for (let x = 0; x < brush[0].length; x++) {
                let char, fgColor, bgColor;
                const cpixValues = intToValues(brush[y][x]);
                char = char_palette[cpixValues[0]];
                fgColor = color_palette[cpixValues[1]];
                bgColor = color_palette[cpixValues[2]];

                const visibleChar = char && fgColor;
                if (!visibleChar && !bgColor) continue; // if cpix has no visibility, we skip

                // Draw background
                if (bgColor) {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(
                        x * charSize, y * charSize,
                        charSize, charSize
                    );
                }

                // Draw text
                if (visibleChar) {
                    const [fontIndex, charUnicode] = cpixIntToValues(char);
                    const fontName = fonts[fontIndex];
                    ctx.font = `400 ${charSize}px "${fontName}", "Adobe Blank"`;

                    ctx.fillStyle = fgColor;

                    const center_x = (x * charSize) + (charSize / 2);
                    const center_y = (y * charSize) + (charSize / 2);
                    ctx.fillText(String.fromCharCode(charUnicode), center_x, center_y);
                }
            }
        }

        const bgImage = canv.toDataURL();

        return (
            <div style={{ width: 70, height: 70, backgroundImage: `url(${bgImage})`, backgroundPosition: "center", backgroundRepeat: "no-repeat" }} data-index={index} className={className} {...otherProps} />
        )
    }
}

const mapStateToProps = (state) => ({
    fonts: state.document.fonts,
    char_palette: state.document.palette.char,
    color_palette: state.document.palette.color,
})

export default connect(mapStateToProps)(GridCellBrush);