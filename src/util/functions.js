export function valuesToInt(v1, v2, v3, v4) {
    return (v1 | (v2 << 8) | (v3 << 16) | (v4 << 24)) >>> 0;
}

export function intToValues(int) {
    return [(int << 24) >>> 24, (int << 16) >>> 24, (int << 8) >>> 24, int >>> 24];
}

export function cpixIntToValues(int) {
    return [int >>> 24, (int << 8) >>> 8];
}

export function cpixValuesToInt(v1, v2) {
    return (v2 | (v1 << 24)) >>> 0;
}

export function isKeyCodePrintable(keyCode) {
    const valid =
        (keycode > 47 && keycode < 58) || // number keys
        keycode == 32 || keycode == 13 || // spacebar & return key(s) (if you want to allow carriage returns)
        (keycode > 64 && keycode < 91) || // letter keys
        (keycode > 95 && keycode < 112) || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223);   // [\]' (in order)
    return valid;
}

export function compareProps(keys, nextProps, currentProps) {
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (nextProps[key] !== currentProps[key]) return true;
    }
    return false;
}

/*
export function valuesToInt(v1, v2, v3, v4) {
    return (v1 | (v2 << 16) | (v3 << 24)) >>> 0;
}

export function intToValues(int) {
    return [(int << 16) >>> 16, (int << 8) >>> 24, int >>> 24];
}
*/

export function base64ToArrayBuffer(base64) {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function randomize2dArray(arr) {
    const vSize = arr.length;
    const hSize = arr[0].length;
    const matrix = arr.map(r => [...r]);
    for (let y = vSize - 1; y > 0; y--) {
        for (let x = hSize - 1; x > 0; x--) {
            const vr = Math.floor(Math.random() * (y + 1));
            const hr = Math.floor(Math.random() * (x + 1));
            const temp = matrix[y][x];
            matrix[y][x] = matrix[vr][hr];
            matrix[vr][hr] = temp;
        }
    }
    return matrix;
}

export function flip2dArrayHorizontally(arr) {
    return [...arr].map(r => [...r].reverse());
}

export function flip2dArrayVertically(arr) {
    return [...arr].reverse();
}

export const downloadFile = (content, filename, contentType = 'text/plain') => {
    const a = document.createElement('a');

    let file;
    if (content instanceof Blob) {
        file = content;
    } else {
        file = new Blob([content], { type: contentType });
    }

    a.href = URL.createObjectURL(file);
    a.download = filename;
    a.click();

    URL.revokeObjectURL(a.href);
};