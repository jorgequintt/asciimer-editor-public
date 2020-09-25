import opentype from "opentype.js";
import { base64ToArrayBuffer } from "../util/functions";

export const fromBuffer = (raw) => {
    const parsedFont = opentype.parse(raw);

    let glyphs = [];
    const glyphset_keys = Object.keys(parsedFont.glyphs.glyphs);
    for (let i = 0; i < glyphset_keys.length; i++) {
        const unicode = parsedFont.glyphs.glyphs[i].unicode;
        if (unicode) glyphs.push(unicode);
    }

    const name = parsedFont.names.compatibleFullName.en;
    const font = {
        name,
        glyphs,
        data: raw,
    };

    return font;
};


export const fromFile = (file) => {
    return new Promise((res) => {
        const reader = new FileReader();
        reader.onload = (result) => {
            const raw = result.currentTarget.result;
            const font = fromBuffer(raw);

            res(font);
        };
        reader.readAsArrayBuffer(file);
    });
};

export const loadFont = async (font_data) => {
    let font_obj;
    if (font_data instanceof String || typeof font_data === "string") {
        // when loading from document
        const arrayBuffer = base64ToArrayBuffer(font_data);
        font_obj = fromBuffer(arrayBuffer);
    } else if (font_data instanceof ArrayBuffer) {
        font_obj = fromBuffer(font_data);
    } else {
        font_obj = await fromFile(font_data);
    }

    const fontFace = new FontFace(font_obj.name, font_obj.data);
    await fontFace.load();
    document.fonts.add(fontFace);

    // save data globally
    if (window.fonts === undefined) {
        window.fonts = {};
    }

    window.fonts[font_obj.name] = {
        glyphs: font_obj.glyphs,
        data: font_obj.data,
    };

    return font_obj;
};

export const removeFont = (fontName) => {
    let fontFace;
    document.fonts.forEach((font) => {
        if (font.family === fontName) fontFace = font;
    });
    document.fonts.delete(fontFace);

    delete window.fonts[fontName];
};
